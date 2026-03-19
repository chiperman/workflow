import { formatDateForTooltip } from '@/lib/heatmap-calendar';
import { getBeijingDateString } from '@/lib/utils';
import type { HeatmapDay } from '@/types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

interface HeatmapTooltipProps {
  day: HeatmapDay;
  children: ReactNode;
  allServices?: { service: string; created_at: string }[];
}

/**
 * Legacy wrapper for backward compatibility or simple use cases
 */
export function HeatmapTooltip({ day, children, allServices }: HeatmapTooltipProps) {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>
        <div>{children}</div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-sm shadow-md animate-in fade-in zoom-in-95 duration-75 hidden md:block pointer-events-none"
          style={{ pointerEvents: 'none' }}
          sideOffset={4}
          side="top"
        >
          <HeatmapTooltipContent day={day} allServices={allServices} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

interface HeatmapTooltipContentProps {
  day: HeatmapDay;
  allServices?: { service: string; created_at: string }[];
}

export function HeatmapTooltipContent({ day, allServices }: HeatmapTooltipContentProps) {
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

  const successServices = Object.entries(day.services)
    .filter(([, status]) => status === 'success')
    .map(([service]) => service.charAt(0).toUpperCase() + service.slice(1));

  const unexecutedServices = (allServices || [])
    .filter(s => {
      const serviceCreatedDateStr = getBeijingDateString(new Date(s.created_at));
      const currentGridDateStr = date;
      return serviceCreatedDateStr <= currentGridDateStr;
    })
    .filter(s => !day.services[s.service])
    .map(s => s.service.charAt(0).toUpperCase() + s.service.slice(1));

  return (
    <>
      <div className="font-medium whitespace-nowrap">{message}</div>
      {successServices.length > 0 && (
        <div className="mt-1 text-emerald-300">Success: {successServices.join(', ')}</div>
      )}
      {failedServices.length > 0 && (
        <div className="mt-1 text-red-300">Failed: {failedServices.join(', ')}</div>
      )}
      {unexecutedServices.length > 0 && (
        <div className="mt-1 text-gray-400">Unexecuted: {unexecutedServices.join(', ')}</div>
      )}
    </>
  );
}
