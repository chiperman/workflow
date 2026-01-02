import { supabase } from '@/lib/supabase';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult, StatsQueryResult } from '@/types';
import { BaseService } from './BaseService';

export class SupabaseService extends BaseService {
  constructor() {
    super('Supabase');
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    const start = Date.now();
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

      const duration = Date.now() - start;
      const beijingTime = getBeijingTime();

      const action = existing ? 'updated' : 'created';
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';
      const message = `Supabase Keep-Alive Success: ${baseAction} at ${beijingTime} (${trigger} run). Counts: Auto=${autoCount}, Manual=${manualCount}. Duration: ${duration}ms.`;

      return {
        success: true,
        action,
        message,
        duration,
        data: {
          manual_count: manualCount,
          auto_count: autoCount,
        },
      };
    } catch (error: unknown) {
      const duration = Date.now() - start;
      let customMsg = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        customMsg = "Table 'keep_alive' does not exist.";
      }

      return { success: false, message: customMsg, duration, error: customMsg };
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
      return { success: false, error: errorMessage };
    }
  }
}

export const supabaseService = new SupabaseService();
