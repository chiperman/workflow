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

export function HeatmapTooltip({ day, children, allServices }: HeatmapTooltipProps) {
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

  // 核心改进：根据创建时间动态计算该日期“已存在”的服务
  // 只有在任务创建之后的日期格子里，才会显示为 Unexecuted
  const unexecutedServices = (allServices || [])
    .filter(s => {
      // 获取该服务的创建日期字符串 (YYYY-MM-DD)
      const serviceCreatedDateStr = getBeijingDateString(new Date(s.created_at));
      // 获取当前格子的日期字符串 (YYYY-MM-DD)
      const currentGridDateStr = date;

      // 只有 创建日期 <= 格子日期 的任务，才算作“应该执行”的任务
      return serviceCreatedDateStr <= currentGridDateStr;
    })
    .filter(s => !day.services[s.service]) // 且当天没有执行记录
    .map(s => s.service.charAt(0).toUpperCase() + s.service.slice(1));

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
