import { logger } from '@/lib/logger';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult } from '@/types';
import { BaseService } from './BaseService';

import { ServiceExecutor } from '@/lib/ServiceExecutor';

export class SupabaseService extends BaseService {
  constructor() {
    super('Supabase');
    this.notificationLevel = 'failure-only';
  }

  // 业务逻辑保持不变，仍在 executeKeepAlive 中实现
  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      logger.info(`[Supabase] Updating Supabase...`);
      const updateResult = await this.updateServiceStats(true, trigger);
      if (!updateResult.ok) {
        throw new Error(updateResult.error);
      }
      const { action, data: stats } = updateResult.data;

      const beijingTime = getBeijingTime();
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';
      const message = `Supabase Success: ${baseAction} at ${beijingTime} (${trigger}). Auto=${stats.auto_count}, Manual=${stats.manual_count}.`;

      logger.info(`[Supabase] Complete: ${message}`);
      return {
        success: true,
        action,
        message,
        duration: 0,
        data: stats,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Supabase] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }

  // 统一入口，由 ServiceExecutor 负责开关、日志、错误处理
  public async run(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    return ServiceExecutor.runService(this, trigger);
  }
}

export const supabaseService = new SupabaseService();
