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

  return (
    <Tooltip.Root delayDuration={100}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded shadow-lg animate-in fade-in zoom-in-95 duration-200"
          sideOffset={5}
          side="top"
        >
          <div className="font-medium">{message}</div>
          {failedServices.length > 0 && (
            <div className="mt-1 text-red-300">Failed: {failedServices.join(', ')}</div>
          )}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
