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
      .from('service_configs')
      .select('enabled')
      .eq('service', serviceKey)
      .single();
    if (error) {
      logger.warn(
        `[ServiceExecutor] Failed to fetch enabled flag for ${serviceKey}: ${error.message}`
      );
      return error.code === 'PGRST116';
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
        .from('service_stats')
        .select('failure_count')
        .eq('service', serviceKey)
        .single();

      if (existing) {
        // 更新现有统计 (仅更新失败计数和时间戳)
        await supabase
          .from('service_stats')
          .update({
            failure_count: (existing.failure_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('service', serviceKey);
      } else {
        // 如果不存在统计记录，则创建
        await supabase.from('service_stats').insert({
          service: serviceKey,
          failure_count: 1,
          updated_at: new Date().toISOString(),
        });
      }
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
        const res = await service.runKeepAlive(trigger);
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
    await service.logKeepAliveResult({ ...result, duration });

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
