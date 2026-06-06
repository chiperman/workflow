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
  const items = [
    {
      label: 'Auto',
      value: stats.auto_count,
      dotClassName: 'bg-[#a8a8a0]',
    },
    {
      label: 'Manual',
      value: stats.manual_count,
      dotClassName: 'bg-[#a8a8a0]',
    },
    {
      label: 'Failed',
      value: stats.failure_count,
      dotClassName: displayStatus === 'error' ? 'bg-red-500' : 'bg-[#c9c9c2]',
    },
  ];

  return (
    <div className="mt-5" aria-label="Task statistics">
      <div className="grid grid-cols-3 gap-2 border-y border-[#f0f0ed] py-3">
        {items.map(item => (
          <div key={item.label} className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.08em] text-text-secondary">
              <span
                className={`h-1.5 w-1.5 rounded-full ${item.dotClassName}`}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </div>
            <div className="font-mono text-lg leading-none tabular-nums text-foreground">
              <RollingNumber value={item.value} />
            </div>
          </div>
        ))}
      </div>

      {(remoteHeartbeatAt || remoteHeartbeatLagging || consecutiveFailures) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
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
