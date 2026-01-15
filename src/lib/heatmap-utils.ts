export interface LogEntry {
  service: string;
  status: boolean;
  timestamp: string;
}

export interface HeatmapDay {
  date: string;
  success_count: number;
  failure_count: number;
  services: Record<string, 'success' | 'failure'>;
}

interface DayServiceStatus {
  [serviceName: string]: 'success' | 'failure';
}

/**
 * 按北京时间的日期聚合日志 (Eventual Consistency)
 * 逻辑：
 * 1. 按日期分组
 * 2. 在每一天内，按服务分组
 * 3. 如果某服务当天有任何一条 success 记录 (status=true)，则该服务当天视为 success
 * 4. 仅当某服务当天只有 failure 记录时，该服务当天视为 failure
 */
export function aggregateByDay(logs: LogEntry[]): HeatmapDay[] {
  const dayMap = new Map<string, DayServiceStatus>();

  // 1. 遍历日志，确定每个服务在每一天的最终状态
  for (const log of logs) {
    // 转换为北京时间并取日期部分
    const beijingDate = new Date(log.timestamp).toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Shanghai',
    });

    if (!dayMap.has(beijingDate)) {
      dayMap.set(beijingDate, {});
    }

    const dayServices = dayMap.get(beijingDate)!;
    const currentStatus = dayServices[log.service];

    // 如果已经是 success，保持 success (success 优先级最高，覆盖 failure)
    if (currentStatus === 'success') {
      continue;
    }

    // 如果是 success 记录，更新为 success
    if (log.status === true) {
      dayServices[log.service] = 'success';
    }
    // 如果是 failure 记录，且当前没有状态，或者是 failure，则标记为 failure
    else if (!currentStatus) {
      dayServices[log.service] = 'failure';
    }
  }

  // 2. 将中间状态转换为前端需要的 HeatmapDay 格式
  const result: HeatmapDay[] = [];

  for (const [date, services] of dayMap.entries()) {
    let successCount = 0;
    let failureCount = 0;
    const servicesMap: Record<string, 'success' | 'failure'> = {};

    for (const [serviceName, status] of Object.entries(services)) {
      servicesMap[serviceName] = status;
      if (status === 'success') {
        successCount++;
      } else {
        failureCount++;
      }
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
