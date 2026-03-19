import type { ServiceHealth } from '@/types';
import { memo } from 'react';
import { RollingNumber } from '../RollingNumber';

interface StatsProps {
  stats: ServiceHealth['stats'];
  displayStatus: 'idle' | 'loading' | 'success' | 'error' | 'deleting';
}

export const Stats = memo(function Stats({ stats, displayStatus }: StatsProps) {
  return (
    <div
      className="flex mt-4 text-xs font-mono text-text-secondary uppercase tracking-wider"
      aria-label="Task statistics"
    >
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
  );
});
