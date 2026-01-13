import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult, StatsQueryResult } from '@/types';
import { BaseService } from './BaseService';

export class GladosService extends BaseService {
  constructor() {
    super('GLaDOS');
    this.notificationLevel = 'failure-only';
  }

  private get headers(): HeadersInit {
    const cookie = env.glados.cookie;
    if (!cookie) {
      throw new Error('GLADOS_COOKIE environment variable is not set');
    }
    return {
      'Content-Type': 'application/json',
      Cookie: cookie,
    };
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      const apiUrls = [env.glados.apiUrl, 'https://glados.rocks/api/user/checkin'].filter(
        Boolean
      ) as string[];

      let lastError: Error | null = null;
      let responseData: unknown = null;

      for (const apiUrl of apiUrls) {
        try {
          logger.info(`[GLaDOS] Trying API: ${apiUrl}`);
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ token: 'glados.one' }),
          });

          responseData = await response.json();
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          lastError = null;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          logger.warn(`[GLaDOS] API ${apiUrl} failed:`, lastError.message);
          continue;
        }
      }

      if (lastError) {
        return {
          success: false,
          message: `GLaDOS API failed: ${lastError.message}`,
          duration: 0,
          error: lastError.message,
        };
      }

      const data = responseData as { code: number; message?: string };

      if (data.code !== 0 && data.code !== 1) {
        return {
          success: false,
          message: `GLaDOS check-in failed: ${data.message || 'Unknown error'}`,
          duration: 0,
          error: data.message,
        };
      }

      const isAlreadyCheckedIn = data.code === 1;
      const checkinMessage = data.message || '';

      logger.info(`[GLaDOS] API success, updating Supabase...`);
      const { data: existing, error: fetchError } = await supabase
        .from('keep_alive')
        .select('*')
        .eq('service', 'glados')
        .single();

      if (fetchError) {
        if (fetchError.code === '42P01') {
          return {
            success: false,
            message: "Table 'keep_alive' does not exist. Please execute the SQL setup.",
            duration: 0,
            error: fetchError.message,
          };
        }
        if (fetchError.code !== 'PGRST116') {
          logger.error(`[GLaDOS] Supabase select error:`, fetchError);
          throw new Error(`Supabase select failed: ${fetchError.message}`);
        }
      }

      let manualCount = existing?.manual_count || 0;
      let autoCount = existing?.auto_count || 0;

      if (!isAlreadyCheckedIn) {
        if (trigger === 'manual') manualCount++;
        else autoCount++;
      }

      const { error: upsertError } = await supabase
        .from('keep_alive')
        .upsert({
          service: 'glados',
          timestamp: new Date().toISOString(),
          manual_count: manualCount,
          auto_count: autoCount,
        })
        .select()
        .single();

      if (upsertError) {
        logger.error(`[GLaDOS] Supabase upsert error:`, upsertError);
        throw new Error(`Supabase upsert failed: ${upsertError.message}`);
      }

      const beijingTime = getBeijingTime();
      const action = existing ? 'updated' : 'created';
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';

      let message: string;
      if (isAlreadyCheckedIn) {
        message = `GLaDOS Checked-in: "${checkinMessage}" [Executed at ${beijingTime} (${trigger})]`;
      } else {
        message = `GLaDOS Success: ${baseAction} at ${beijingTime} (${trigger}). Auto=${autoCount}, Manual=${manualCount}.`;
      }

      logger.info(`[GLaDOS] Complete: ${message}`);
      return {
        success: true,
        action,
        message,
        duration: 0,
        data: {
          manual_count: manualCount,
          auto_count: autoCount,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[GLaDOS] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }

  public async getStats(): Promise<StatsQueryResult> {
    try {
      const { data: existing, error } = await supabase
        .from('keep_alive')
        .select('manual_count, auto_count, enabled')
        .eq('service', 'glados')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: { manual_count: 0, auto_count: 0 },
            tableExists: true,
            enabled: true,
          };
        }
        if (error.code === '42P01') {
          return {
            success: false,
            data: { manual_count: 0, auto_count: 0 },
            tableExists: false,
            error: "Table 'keep_alive' does not exist",
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
        enabled: existing?.enabled ?? true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[GLaDOS] getStats error:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export const gladosService = new GladosService();
