import { sendBarkNotification } from '@/lib/bark';
import { withRetry } from '@/lib/utils';
import type { KeepAliveResult, StatsQueryResult } from '@/types';

export abstract class BaseService {
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
    try {
      const result = await withRetry(async () => {
        const res = await this.executeKeepAlive(trigger);
        if (!res.success) {
          throw new Error(res.message || 'Service reported failure');
        }
        return res;
      });

      // 发送成功通知
      await sendBarkNotification(
        `✅ ${this.serviceName} Success`,
        result.message,
        `${this.serviceName}-Success`
      );

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${this.serviceName}] Max retries exhausted:`, error);

      // 发送失败通知
      await sendBarkNotification(
        `❌ ${this.serviceName} Failed`,
        errorMessage,
        `${this.serviceName}-Failed`
      );

      return {
        success: false,
        message: `Failed after max retries: ${errorMessage}`,
        duration: 0,
        error: errorMessage,
      };
    }
  }
}
