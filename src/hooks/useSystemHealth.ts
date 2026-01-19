import { useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import type { HealthCheckResponse, ServiceHealth, SystemStatus } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface UseSystemHealthResult {
  stats: HealthCheckResponse | undefined;
  isLoading: boolean;
  error: unknown;
  supabaseHealth: ServiceHealth;
  gladosHealth: ServiceHealth;
  systemStatus: SystemStatus;
  failingServices: string[];
  refreshAll: () => Promise<void>;
  isRefreshing: boolean; // simple boolean state for refreshing UI
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

  // 2. Derive Service Health
  const supabaseHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.supabase || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      },
    [data]
  );

  const gladosHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.glados || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      },
    [data]
  );

  // 3. Derive System Info
  const systemStatus = data?.status || 'Checking';

  const failingServices = useMemo(() => {
    const failing: string[] = [];
    if (supabaseHealth.status === 'outage' || supabaseHealth.status === 'misconfigured') {
      failing.push('Supabase');
    }
    if (gladosHealth.status === 'outage' || gladosHealth.status === 'misconfigured') {
      failing.push('GLaDOS');
    }
    return failing;
  }, [supabaseHealth.status, gladosHealth.status]);

  // 4. Global Refresh Handler
  const refreshAll = async () => {
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
  };

  return {
    stats: data,
    isLoading,
    error,
    supabaseHealth,
    gladosHealth,
    systemStatus,
    failingServices,
    refreshAll,
    isRefreshing,
  };
}
