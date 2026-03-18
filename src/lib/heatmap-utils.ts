import { HEATMAP_COLORS } from '@/config/constants';
import type { HeatmapDay } from '@/types';
import { getBeijingDateString } from './utils';

export interface LogEntry {
  service: string;
  status: string;
  timestamp: string;
}

interface DayServiceStatus {
  [serviceName: string]: 'success' | 'failure';
}

/**
 * 按北京时间的日期聚合日志 (Eventual Consistency)
 */
export function aggregateByDay(logs: LogEntry[]): HeatmapDay[] {
  const dayMap = new Map<string, DayServiceStatus>();

  for (const log of logs) {
    const beijingDate = getBeijingDateString(new Date(log.timestamp));
    if (!dayMap.has(beijingDate)) {
      dayMap.set(beijingDate, {});
    }

    const dayServices = dayMap.get(beijingDate)!;
    const currentStatus = dayServices[log.service];

    if (currentStatus === 'success') continue;

    if (log.status === 'success') {
      dayServices[log.service] = 'success';
    } else if (!currentStatus) {
      dayServices[log.service] = 'failure';
    }
  }

  const result: HeatmapDay[] = [];
  for (const [date, services] of dayMap.entries()) {
    let successCount = 0;
    let failureCount = 0;
    const servicesMap: Record<string, 'success' | 'failure'> = {};

    for (const [serviceName, status] of Object.entries(services)) {
      servicesMap[serviceName] = status;
      if (status === 'success') successCount++;
      else failureCount++;
    }

    result.push({
      date,
      success_count: successCount,
      failure_count: failureCount,
      services: servicesMap,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 根据数据计算热力图单元格颜色
 * 纯函数，浏览器安全
 */
export function getColorClass(date: string, day?: HeatmapDay): string {
  if (!date || !day) return HEATMAP_COLORS.LEVEL_0;
  if (day.failure_count > 0) return HEATMAP_COLORS.LEVEL_FAILURE;
  if (day.success_count > 0) return HEATMAP_COLORS.LEVEL_SUCCESS;
  return HEATMAP_COLORS.LEVEL_0;
}
