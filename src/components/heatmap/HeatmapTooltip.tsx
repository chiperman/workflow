import { VALID_SERVICES } from '@/config/constants';
import { formatDateForTooltip } from '@/lib/heatmap-calendar';
import type { HeatmapDay } from '@/types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

interface HeatmapTooltipProps {
  day: HeatmapDay;
  children: ReactNode;
}

export function HeatmapTooltip({ day, children }: HeatmapTooltipProps) {
  const { success_count, failure_count, date } = day;
  const total = success_count + failure_count;
  const dateText = formatDateForTooltip(date);

  let message = '';
  if (total === 0) {
    message = `No check-ins on ${dateText}`;
  } else {
    const parts: string[] = [];
    if (success_count > 0) parts.push(`${success_count} successful`);
    if (failure_count > 0) parts.push(`${failure_count} failed`);

    const description = parts.join(', ');
    const unit = total === 1 ? 'check-in' : 'check-ins';
    message = `${description} ${unit} on ${dateText}`;
  }

  const failedServices = Object.entries(day.services)
    .filter(([, status]) => status === 'failure')
    .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));

  // Find unexecuted services (exist in config but not in day's records)
  // 未执行的服务 (推断)
  const unexecutedServices = (VALID_SERVICES as readonly string[])
    .filter(service => !day.services[service])
    .map(service => service.charAt(0).toUpperCase() + service.slice(1));
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-sm shadow-md animate-in fade-in zoom-in-95 duration-75 hidden md:block pointer-events-none"
          style={{ pointerEvents: 'none' }}
          sideOffset={4}
          side="top"
        >
          <div className="font-medium">{message}</div>
          {failedServices.length > 0 && (
            <div className="mt-1 text-red-300">Failed: {failedServices.join(', ')}</div>
          )}
          {unexecutedServices.length > 0 && (
            <div className="mt-1 text-gray-400">Unexecuted: {unexecutedServices.join(', ')}</div>
          )}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
