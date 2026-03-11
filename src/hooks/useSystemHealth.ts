import { useMemo, useState, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import type { HealthCheckResponse, ServiceHealth, SystemStatus, ApiResponse } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UseSystemHealthResult {
  stats: HealthCheckResponse | undefined;
  isLoading: boolean;
  error: unknown;
  services: Record<string, ServiceHealth>;
  systemStatus: SystemStatus;
  failingServices: string[];
  refreshAll: () => Promise<void>;
  isRefreshing: boolean;
  authType: 'cron' | 'app-key' | 'session' | 'public' | 'none';
}

/**
 * 全系统健康状态管理 Hook
 * 处理标准化 API 响应逻辑 (withApiHandler 适配)
 */
export function useSystemHealth(): UseSystemHealthResult {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch Health Data (Standardized ApiResponse)
  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR<ApiResponse<HealthCheckResponse>>('/api/health', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateIfStale: false,
    revalidateOnMount: true,
  });

  // 提取实际负载
  const data = response?.success ? response.data : undefined;

  // 2. Derive Service Health (Dynamic)
  const services = useMemo(() => data?.services || {}, [data]);

  // 3. Derive System Info
  const systemStatus = data?.status || 'Checking';
  const authType = data?.auth?.type || 'none';

  const failingServices = useMemo(() => {
    return Object.entries(services)
      .filter(([_, health]) => health.status === 'outage' || health.status === 'misconfigured')
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
  }, [services]);

  // 4. Global Refresh Handler
  const refreshAll = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        mutate(), // Refresh health data
        globalMutate(
          key => typeof key === 'string' && key.startsWith('/api/stats/heatmap'),
          undefined,
          { revalidate: true }
        ),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, mutate]);

  return {
    stats: data,
    isLoading,
    error,
    services,
    systemStatus,
    failingServices,
    refreshAll,
    isRefreshing,
    authType,
  };
}
