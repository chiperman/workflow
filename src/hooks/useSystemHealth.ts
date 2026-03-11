import { useMemo, useState, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import type { HealthCheckResponse, ServiceHealth, SystemStatus } from '@/types';

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

export function useSystemHealth(): UseSystemHealthResult {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch Health Data
  const { data, error, isLoading, mutate } = useSWR<HealthCheckResponse>('/api/health', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateIfStale: false,
    revalidateOnMount: true,
  });

  // 2. Derive Service Health (Dynamic)
  const services = useMemo(() => data?.services || {}, [data]);

  // 3. Derive System Info
  const systemStatus = data?.status || 'Checking';
  const authType = data?.auth?.type || 'none';

  const failingServices = useMemo(() => {
    return Object.entries(services)
      .filter(([_, health]) => health.status === 'outage' || health.status === 'misconfigured')
      .map(([name, _]) => name.charAt(0).toUpperCase() + name.slice(1));
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
