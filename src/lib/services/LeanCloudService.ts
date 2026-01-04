import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getBeijingTime } from '@/lib/utils';
import type { KeepAliveResult, StatsQueryResult } from '@/types';
import { BaseService } from './BaseService';

export class LeanCloudService extends BaseService {
  constructor() {
    super('LeanCloud');
    this.notificationLevel = 'failure-only';
  }

  private get headers(): HeadersInit {
    return {
      'X-LC-Id': env.leancloud.appId,
      'X-LC-Key': env.leancloud.masterKey
        ? `${env.leancloud.masterKey},master`
        : env.leancloud.appKey,
      'Content-Type': 'application/json',
    };
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      const queryUrl = `${env.leancloud.serverUrl}/1.1/classes/keep_alive?limit=1`;
      const queryRes = await fetch(queryUrl, { headers: this.headers });

      let existingRecord = null;
      if (queryRes.ok) {
        const queryData = await queryRes.json();
        existingRecord =
          queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;
      } else if (queryRes.status !== 404) {
        const errText = await queryRes.text();
        throw new Error(`Query failed: ${queryRes.status} ${errText}`);
      }

      let action: 'updated' | 'created';
      const incrementField = trigger === 'manual' ? 'manual_count' : 'auto_count';
      let finalAuto = 0;
      let finalManual = 0;

      if (existingRecord) {
        const updateUrl = `${env.leancloud.serverUrl}/1.1/classes/keep_alive/${existingRecord.objectId}`;
        const currentCount = existingRecord[incrementField] || 0;
        const newCount = currentCount + 1;

        const updateBody = {
          timestamp: { __type: 'Date', iso: new Date().toISOString() },
          triggeredBy: `cron-job - ${trigger}`,
          [incrementField]: newCount,
        };

        const updateRes = await fetch(updateUrl, {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(updateBody),
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          throw new Error(`Update failed: ${updateRes.status} ${errText}`);
        }

        action = 'updated';
        finalAuto = existingRecord.auto_count || 0;
        finalManual = existingRecord.manual_count || 0;
        if (trigger === 'manual') finalManual++;
        else finalAuto++;
      } else {
        const createUrl = `${env.leancloud.serverUrl}/1.1/classes/keep_alive`;
        const createBody = {
          timestamp: { __type: 'Date', iso: new Date().toISOString() },
          triggeredBy: `cron-job - ${trigger}`,
          manual_count: trigger === 'manual' ? 1 : 0,
          auto_count: trigger === 'auto' ? 1 : 0,
        };

        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(createBody),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Create failed: ${createRes.status} ${errText}`);
        }

        action = 'created';
        finalAuto = trigger === 'auto' ? 1 : 0;
        finalManual = trigger === 'manual' ? 1 : 0;
      }

      const beijingTime = getBeijingTime();
      const baseAction = action === 'created' ? 'Created new record' : 'Updated record';
      const message = `LeanCloud Success: ${baseAction} at ${beijingTime} (${trigger}). Auto=${finalAuto}, Manual=${finalManual}.`;

      return {
        success: true,
        action,
        message,
        duration: 0,
        data: {
          auto_count: finalAuto,
          manual_count: finalManual,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[LeanCloud] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }

  public async getStats(): Promise<StatsQueryResult> {
    try {
      const queryUrl = `${env.leancloud.serverUrl}/1.1/classes/keep_alive?limit=1`;
      const queryRes = await fetch(queryUrl, { headers: this.headers });

      if (!queryRes.ok) {
        if (queryRes.status === 404) {
          return {
            success: true,
            data: { manual_count: 0, auto_count: 0 },
            tableExists: false,
            enabled: true,
          };
        }
        throw new Error(`Query failed: ${queryRes.status}`);
      }

      const queryData = await queryRes.json();
      const record =
        queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;

      return {
        success: true,
        data: {
          manual_count: record?.manual_count || 0,
          auto_count: record?.auto_count || 0,
        },
        tableExists: true,
        enabled: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[LeanCloud] getStats error:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export const leanCloudService = new LeanCloudService();
