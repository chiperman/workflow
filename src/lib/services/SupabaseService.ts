import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult, StatsQueryResult } from '@/types';
import { BaseService } from './BaseService';

export class SupabaseService extends BaseService {
  constructor() {
    super('Supabase');
    // 对于这类高频保活任务，建议主要在失败或手动运行时通过 Bark 发送成功通知
    this.notificationLevel = 'failure-only';
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('keep_alive')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let manualCount = existing?.manual_count || 0;
      let autoCount = existing?.auto_count || 0;

      if (trigger === 'manual') manualCount++;
      else autoCount++;

      const { error: upsertError } = await supabase
        .from('keep_alive')
        .upsert({
          id: 1,
          timestamp: new Date().toISOString(),
          manual_count: manualCount,
          auto_count: autoCount,
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      const beijingTime = getBeijingTime();
      const action = existing ? 'updated' : 'created';
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';
      const message = `Supabase Success: ${baseAction} at ${beijingTime} (${trigger}). Auto=${autoCount}, Manual=${manualCount}.`;

      return {
        success: true,
        action,
        message,
        duration: 0, // 基类会重新计算总耗时
        data: {
          manual_count: manualCount,
          auto_count: autoCount,
        },
      };
    } catch (error: unknown) {
      let customMsg = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        customMsg = "Table 'keep_alive' does not exist.";
      }
      logger.error(`[Supabase] executeKeepAlive error:`, customMsg);

      return { success: false, message: customMsg, duration: 0, error: customMsg };
    }
  }

  public async getStats(): Promise<StatsQueryResult> {
    try {
      const { data: existing, error } = await supabase
        .from('keep_alive')
        .select('manual_count, auto_count')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: { manual_count: 0, auto_count: 0 },
            tableExists: true,
          };
        }
        if (error.code === '42P01') {
          return {
            success: true,
            data: { manual_count: 0, auto_count: 0 },
            tableExists: false,
          };
        }
        throw error;
      }

      return {
        success: true,
        data: {
          manual_count: existing?.manual_count || 0,
          auto_count: existing?.auto_count || 0,
        },
        tableExists: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Supabase] getStats error:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export const supabaseService = new SupabaseService();
