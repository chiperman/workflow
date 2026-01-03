import { sendBarkNotification } from '@/lib/bark';
import { logger } from '@/lib/logger';
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
   * 带重试、通知和计时功能的执行入口
   */
  public async run(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    const startTime = Date.now();
    try {
      logger.info(`[${this.serviceName}] Starting keep-alive run (trigger: ${trigger})`);

      const result = await withRetry(async () => {
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
      return { ...result, duration };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${this.serviceName}] Execution failed after retries:`, errorMessage);

      // 失败总是通知开关（除非级别设为 none 且明确要求静默，但通常失败需要知晓）
      if (this.notificationLevel !== 'none') {
        await sendBarkNotification(
          `❌ ${this.serviceName} Failed`,
          errorMessage,
          `${this.serviceName}-Failed`
        );
      }

      return {
        success: false,
        message: `Failed after max retries: ${errorMessage}`,
        duration,
        error: errorMessage,
      };
    }
  }
}
