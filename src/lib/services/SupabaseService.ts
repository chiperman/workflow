import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult } from '@/types';
import { BaseService } from './BaseService';

export class SupabaseService extends BaseService {
  constructor() {
    super('Supabase');
    this.notificationLevel = 'failure-only';
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      logger.info(`[Supabase] Selecting existing record...`);
      const { data: existing, error: fetchError } = await supabase
        .from('keep_alive')
        .select('*')
        .eq('service', 'supabase')
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No record yet
        } else if (fetchError.code === '42P01') {
          return {
            success: false,
            message: "Table 'keep_alive' does not exist. Please execute the SQL setup.",
            duration: 0,
            error: fetchError.message,
          };
        } else {
          throw fetchError;
        }
      }

      let manualCount = existing?.manual_count || 0;
      let autoCount = existing?.auto_count || 0;

      if (trigger === 'manual') manualCount++;
      else autoCount++;

      logger.info(`[Supabase] Upserting record...`);
      const { error: upsertError } = await supabase
        .from('keep_alive')
        .upsert({
          service: 'supabase',
          timestamp: new Date().toISOString(),
          manual_count: manualCount,
          auto_count: autoCount,
        })
        .select()
        .single();

      if (upsertError) {
        logger.error(`[Supabase] Upsert error:`, upsertError);
        throw new Error(`Supabase upsert failed: ${upsertError.message}`);
      }

      const beijingTime = getBeijingTime();
      const action = existing ? 'updated' : 'created';
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';
      const message = `Supabase Success: ${baseAction} at ${beijingTime} (${trigger}). Auto=${autoCount}, Manual=${manualCount}.`;

      logger.info(`[Supabase] Complete: ${message}`);
      return {
        success: true,
        action,
        message,
        duration: 0,
        data: {
          manual_count: manualCount,
          auto_count: autoCount,
          failure_count: existing?.failure_count || 0,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Supabase] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }
}

export const supabaseService = new SupabaseService();
