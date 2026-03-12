import { useMemo } from 'react';
import { useSystemHealth } from './useSystemHealth';
import { ServiceHealth, ServiceStatus } from '@/types';

export interface TaskCardData {
  id: string;
  title: string;
  category: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  serviceHealth: ServiceHealth;
  serviceName: string;
}

/**
 * 封装任务列表的映射逻辑 (View Model Hook)
 */
export function useTasks() {
  const { services, ...healthRest } = useSystemHealth();

  const taskCards = useMemo(() => {
    const cards = Object.entries(services).map(([id, health]) => {
      const isInternal = health.type === 'supabase_internal' || id === 'supabase';

      return {
        id,
        title: health.name || id.charAt(0).toUpperCase() + id.slice(1),
        category: health.category || (isInternal ? 'Database Maintenance' : 'Access Protocol'),
        description: health.description || 'Automated maintenance protocol.',
        endpoint: `/api/tasks/${id}`,
        method: 'POST' as const,
        serviceHealth: health,
        serviceName: id,
      } as TaskCardData;
    });

    // 显式排序，确保顺序稳定，不随 services 对象属性顺序改变
    return cards.sort((a, b) => a.id.localeCompare(b.id));
  }, [services]);

  const serviceStatuses = useMemo(() => {
    const statuses: Record<string, ServiceStatus | undefined> = {};
    Object.entries(services).forEach(([name, health]) => {
      statuses[name] = health.status;
    });
    return statuses;
  }, [services]);

  return {
    taskCards,
    serviceStatuses,
    services,
    ...healthRest,
  };
}
