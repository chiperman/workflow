import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult } from '@/types';
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
      const apiUrls = [env.glados.apiUrl, 'https://glados.cloud/api/user/checkin'].filter(
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
            body: JSON.stringify({ token: 'glados.cloud' }),
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

      const updateResult = await this.updateServiceStats(!isAlreadyCheckedIn, trigger);
      if (!updateResult.ok) {
        throw new Error(updateResult.error);
      }
      const { action, data: stats } = updateResult.data;

      const beijingTime = getBeijingTime();
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';

      let message: string;
      if (isAlreadyCheckedIn) {
        message = `GLaDOS Checked-in: "${checkinMessage}" [Executed at ${beijingTime} (${trigger})]`;
      } else {
        message = `GLaDOS Success: ${baseAction} at ${beijingTime} (${trigger}). Auto=${stats.auto_count}, Manual=${stats.manual_count}.`;
      }

      logger.info(`[GLaDOS] Complete: ${message}`);
      return {
        success: true,
        action,
        message,
        duration: 0,
        data: stats,
        // 重复签到时跳过日志记录，避免覆盖真正的签到状态
        skipLog: isAlreadyCheckedIn,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[GLaDOS] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }
}

export const gladosService = new GladosService();
