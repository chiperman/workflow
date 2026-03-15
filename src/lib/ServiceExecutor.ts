import { sendBarkNotification } from '@/lib/bark';
import { logger } from '@/lib/logger';
import type { BaseService } from '@/services/BaseService';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/utils';
import type { KeepAliveResult } from '@/types';

/**
 * ServiceExecutor - 统一处理服务开关、执行、日志记录、错误捕获。
 * 用法: `await ServiceExecutor.runService(myServiceInstance, trigger)`
 */
export class ServiceExecutor {
  /**
   * 检查服务是否启用
   */
  private static async isEnabled(serviceKey: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('keep_alive')
      .select('enabled')
      .eq('service', serviceKey)
      .single();
    if (error) {
      // 默认开启，记录警告
      logger.warn(
        `[ServiceExecutor] Failed to fetch enabled flag for ${serviceKey}: ${error.message}`
      );
      return true;
    }
    return data?.enabled ?? true;
  }

  /**
   * 记录失败统计
   */
  private static async recordFailure(serviceKey: string, serviceName: string): Promise<void> {
    try {
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
      logger.warn(
        `[${serviceName}] Failed to record failure stats:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * 统一执行服务的 keep‑alive 逻辑。
   * - 检查开关
   * - 调用子类的 `executeKeepAlive`
   * - 记录日志（使用子类的 logKeepAliveResult）
   * - 返回带 duration 的结果
   */
  static async runService(
    service: BaseService,
    trigger: 'auto' | 'manual' = 'auto'
  ): Promise<KeepAliveResult> {
    const serviceKey = service.name.toLowerCase();
    const enabled = await this.isEnabled(serviceKey);
    if (!enabled) {
      return {
        success: true,
        message: 'Skipped: service disabled',
        duration: 0,
        skipped: true,
      } as KeepAliveResult & { skipped: boolean };
    }

    const start = Date.now();
    let result: KeepAliveResult;
    try {
      result = await withRetry(async () => {
        const res = await (
          service as unknown as {
            executeKeepAlive: (t: 'auto' | 'manual') => Promise<KeepAliveResult>;
          }
        ).executeKeepAlive(trigger);
        if (!res.success) {
          throw new Error(res.message || 'Service reported failure');
        }
        return res;
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      result = {
        success: false,
        message: `Failed after max retries: ${errorMessage}`,
        duration: Date.now() - start,
        error: errorMessage,
      };
    }

    const duration = Date.now() - start;
    // 记录日志（如果子类实现了 logKeepAliveResult）
    const svc = service as unknown as {
      logKeepAliveResult?: (r: KeepAliveResult) => Promise<void>;
      serviceName: string;
    };
    if (typeof svc.logKeepAliveResult === 'function') {
      await svc.logKeepAliveResult({ ...result, duration });
    } else {
      logger.info(`[${service.name}] No logKeepAliveResult method, skipping log.`);
    }

    // 失败统计
    if (!result.success) {
      await this.recordFailure(serviceKey, service.name);
    }

    // 处理通知
    const notifyLevel = service.notifyLevel;
    const notifyKey = service.notifyKey;

    if (result.success) {
      if (notifyLevel === 'always') {
        await sendBarkNotification(
          `✅ ${service.name} Success`,
          result.message,
          `${service.name}-Success`,
          notifyKey
        );
      }
    } else {
      if (notifyLevel !== 'none') {
        await sendBarkNotification(
          `❌ ${service.name} Failed`,
          result.error || result.message,
          `${service.name}-Failed`,
          notifyKey
        );
      }
    }

    return { ...result, duration };
  }
}
