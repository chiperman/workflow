import type { ServiceHealth } from '@/types';
import { memo } from 'react';
import { RollingNumber } from '../RollingNumber';
import { TIMEZONE } from '@/lib/utils';

interface StatsProps {
  stats: ServiceHealth['stats'];
  displayStatus: 'idle' | 'loading' | 'success' | 'error' | 'deleting';
  remoteHeartbeatAt?: string;
  consecutiveFailures?: number;
  remoteHeartbeatLagging?: boolean;
}

function formatHeartbeat(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    timeZone: TIMEZONE,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const Stats = memo(function Stats({
  stats,
  displayStatus,
  remoteHeartbeatAt,
  consecutiveFailures,
  remoteHeartbeatLagging,
}: StatsProps) {
  return (
    <div aria-label="Task statistics">
      <div className="flex mt-4 text-xs font-mono text-text-secondary uppercase tracking-wider">
        <div className="flex items-center gap-1.5 w-24 shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'error' ? 'bg-red-500' : 'bg-blue-400'}`}
            aria-hidden="true"
          ></span>
          <span>
            Auto: <RollingNumber value={stats.auto_count} />
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`}
            aria-hidden="true"
          ></span>
          <span>
            Manual: <RollingNumber value={stats.manual_count} />
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true"></span>
          <span>
            Failed: <RollingNumber value={stats.failure_count} />
          </span>
        </div>
      </div>

      {(remoteHeartbeatAt || remoteHeartbeatLagging || consecutiveFailures) && (
        <div className="mt-3 pt-3 border-t border-[#f0f0ed] flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
          {(remoteHeartbeatAt || remoteHeartbeatLagging) && (
            <span className={remoteHeartbeatLagging ? 'text-amber-700' : undefined}>
              Last heartbeat:{' '}
              {remoteHeartbeatAt ? formatHeartbeat(remoteHeartbeatAt) : 'Unavailable'}
            </span>
          )}
          {!!consecutiveFailures && (
            <span className="text-red-600">Failure streak: {consecutiveFailures}</span>
          )}
        </div>
      )}
    </div>
  );
});
