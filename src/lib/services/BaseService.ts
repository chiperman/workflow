import { sendBarkNotification } from '@/lib/bark';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/utils';
import type { KeepAliveResult, StatsQueryResult } from '@/types';

export type NotificationLevel = 'always' | 'failure-only' | 'none';

export abstract class BaseService {
  /**
   * 通知策略：
   * always: 每次运行都发送通知
   * failure-only: 仅在失败或手动运行时运行成功后发送通知
   * none: 绝不发送成功通知（失败通知仍可根据逻辑保留）
   */
  protected notificationLevel: NotificationLevel = 'always';

  constructor(protected serviceName: string) {}

  /**
   * 核心保活逻辑，由子类实现
   */
  protected abstract executeKeepAlive(trigger: 'auto' | 'manual'): Promise<KeepAliveResult>;

  /**
   * 获取服务状态，由子类实现
   */
  public abstract getStats(): Promise<StatsQueryResult>;

  /**
   * 记录签到日志到 keep_alive_logs 表
   * 此方法设计为"尽力而为"，失败不影响主逻辑
   */
  private async logKeepAliveResult(result: KeepAliveResult): Promise<void> {
    // 如果结果标记为跳过日志（如重复签到），直接返回
    if (result.skipLog) {
      logger.info(`[${this.serviceName}] Skipping log (skipLog=true).`);
      return;
    }

    try {
      const serviceKey = this.serviceName.toLowerCase();

      // 如果任务成功，检查今天是否已经有成功的记录
      if (result.success) {
        // 获取北京时间当天的 00:00:00 (ISO String)
        // 简单实现：使用 sv-SE locale + Asia/Shanghai
        const todayStr = new Date().toLocaleDateString('sv-SE', {
          timeZone: 'Asia/Shanghai',
        });
        const todayStart = new Date(`${todayStr}T00:00:00.000+08:00`).toISOString();

        const { count } = await supabase
          .from('keep_alive_logs')
          .select('*', { count: 'exact', head: true })
          .eq('service', serviceKey)
          .eq('status', true)
          .gte('timestamp', todayStart);

        if (count && count > 0) {
          logger.info(`[${this.serviceName}] Skipping duplicate log (already succeeded today).`);
          return;
        }
      }

      const { error } = await supabase.from('keep_alive_logs').insert({
        service: serviceKey,
        status: result.success,
      });

      if (error) {
        logger.warn(`[${this.serviceName}] Failed to log keep-alive result:`, error.message);
      }
    } catch (err) {
      // 静默失败，不影响主流程
      logger.warn(
        `[${this.serviceName}] Exception while logging:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * 带重试、通知和计时功能的执行入口
   */
  public async run(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    const startTime = Date.now();
    let result: KeepAliveResult;

    try {
      logger.info(`[${this.serviceName}] Starting keep-alive run (trigger: ${trigger})`);

      result = await withRetry(async () => {
        const res = await this.executeKeepAlive(trigger);
        if (!res.success) {
          throw new Error(res.message || 'Service reported failure');
        }
        return res;
      });

      const duration = Date.now() - startTime;

      // 检查是否需要发送成功通知
      const shouldNotify =
        this.notificationLevel === 'always' ||
        (this.notificationLevel === 'failure-only' && trigger === 'manual');

      if (shouldNotify) {
        await sendBarkNotification(
          `✅ ${this.serviceName} Success`,
          result.message,
          `${this.serviceName}-Success`
        );
      }

      logger.info(`[${this.serviceName}] Completed successfully in ${duration}ms`);

      // 记录日志（需等待完成，避免 Serverless 环境下函数提前退出导致日志丢失）
      await this.logKeepAliveResult(result);

      return { ...result, duration };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${this.serviceName}] Execution failed after retries:`, errorMessage);

      result = {
        success: false,
        message: `Failed after max retries: ${errorMessage}`,
        duration,
        error: errorMessage,
      };

      // 失败总是通知开关（除非级别设为 none 且明确要求静默，但通常失败需要知晓）
      if (this.notificationLevel !== 'none') {
        await sendBarkNotification(
          `❌ ${this.serviceName} Failed`,
          errorMessage,
          `${this.serviceName}-Failed`
        );
      }

      // 记录失败日志
      await this.logKeepAliveResult(result);

      // 记录失败统计 (Fail-safe)
      await this.recordFailure(trigger);

      return result;
    }
  }

  /**
   * 记录失败统计到 Supabase keep_alive 表
   */
  protected async recordFailure(_trigger: 'auto' | 'manual'): Promise<void> {
    try {
      const serviceKey = this.serviceName.toLowerCase();
      // 获取当前统计
      const { data: existing } = await supabase
        .from('keep_alive')
        .select('*')
        .eq('service', serviceKey)
        .single();

      const currentFail = existing?.failure_count || 0;

      // 更新统计 (保留原有成功计数)
      await supabase.from('keep_alive').upsert({
        service: serviceKey,
        timestamp: new Date().toISOString(),
        manual_count: existing?.manual_count || 0,
        auto_count: existing?.auto_count || 0,
        failure_count: currentFail + 1,
        enabled: existing?.enabled ?? true,
      });
    } catch (err) {
      // 统计更新失败不应影响主逻辑，仅记录警告
      logger.warn(
        `[${this.serviceName}] Failed to record failure stats:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }
}
