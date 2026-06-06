'use client';

import type { ServiceHealth } from '@/types';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Actions } from './Actions';
import { Header } from './Header';
import { Stats } from './Stats';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
  method: 'GET' | 'POST';
  serviceHealth: ServiceHealth;
  serviceName: string;
  onStatsUpdate: (newHealth?: ServiceHealth) => void | Promise<void>;
  onEdit?: (id: string) => void;
  isGuest?: boolean;
}

/**
 * 任务卡片组件 (Refactored)
 */
function TaskCardComponent({
  title,
  description,
  endpoint,
  category,
  method,
  serviceHealth,
  serviceName,
  onStatsUpdate,
  onEdit,
  isGuest,
}: TaskCardProps) {
  const [localStatus, setLocalStatus] = useState<
    'idle' | 'loading' | 'success' | 'error' | 'deleting'
  >('idle');
  const [isToggling, setIsToggling] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(serviceHealth.enabled ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localHealth, setLocalHealth] = useState(serviceHealth);

  // 同步 props 变化到 local state
  useEffect(() => {
    if (serviceHealth.enabled !== undefined) {
      setLocalEnabled(serviceHealth.enabled);
    }
    setLocalHealth(serviceHealth);
  }, [serviceHealth]);

  // 自动重置卡片执行状态
  useEffect(() => {
    // 如果卡片目前处于成功或失败的展示状态，延时 3 秒后自动重置回 idle
    // 使得全局刷新能够正确响应和接管卡片表现
    if (localStatus === 'success' || localStatus === 'error') {
      const timer = setTimeout(() => {
        setLocalStatus('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [localStatus]);

  // 计算最终状态
  const displayStatus = useMemo(() => {
    if (localStatus !== 'idle') return localStatus;
    if (localHealth.status === 'outage' || localHealth.status === 'misconfigured') return 'error';
    if (localHealth.status === 'operational') return 'idle';
    return 'idle';
  }, [localStatus, localHealth.status]);

  const handleRun = useCallback(async () => {
    if (localStatus === 'loading') return;

    setLocalStatus('loading');
    const loadingToast = toast.loading(`${title}...`);

    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, {
        method,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setLocalStatus('success');
        toast.success(data.message || `${title} success`, { id: loadingToast });

        if (data.data) {
          const nextHealth: ServiceHealth = {
            ...localHealth,
            status: 'operational',
            tableExists: true,
            stats: data.data,
            message: undefined,
            todayCheckedIn: true,
            consecutiveFailures: 0,
            ...(localHealth.type === 'supabase_internal' && localHealth.config?.supabase_url
              ? {
                  remoteHeartbeatAt: new Date().toISOString(),
                  remoteHeartbeatLagging: false,
                }
              : {}),
          };

          setLocalHealth(nextHealth);
          await onStatsUpdate(nextHealth);
        } else {
          await onStatsUpdate();
        }
      } else {
        setLocalStatus('error');
        toast.error(data.message || `${title} failed`, { id: loadingToast });
      }
    } catch (_error: unknown) {
      setLocalStatus('error');
      toast.error(`${title} failed`, { id: loadingToast });
    }
  }, [endpoint, method, localHealth, localStatus, title, onStatsUpdate]);

  const handleToggle = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    const newEnabled = !localEnabled;
    let success = false;
    try {
      const res = await fetch('/api/service-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: serviceName, enabled: newEnabled }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextHealth = { ...localHealth, enabled: newEnabled };
        setLocalHealth(nextHealth);
        await onStatsUpdate(nextHealth);
        success = true;
      } else {
        toast.error('Toggle failed');
      }
    } catch (_error: unknown) {
      toast.error('Toggle failed');
    } finally {
      setIsToggling(false);
      if (success) {
        toast.success(newEnabled ? 'Auto cron enabled' : 'Auto cron disabled');
      }
    }
  }, [isToggling, localEnabled, serviceName, localHealth, onStatsUpdate]);

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setLocalStatus('deleting');
    try {
      const res = await fetch(`/api/service-config?service=${serviceName}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Task deleted');
        onStatsUpdate(undefined); // Trigger refresh
      } else {
        setLocalStatus('error');
        toast.error('Delete failed');
      }
    } catch (_error: unknown) {
      setLocalStatus('error');
      toast.error('Delete failed');
    }
  }, [serviceName, onStatsUpdate]);

  return (
    <div className="group relative flex flex-col h-full min-h-[360px] bg-white/95 border border-border-custom p-5 rounded-lg transition-all duration-200 ease-out hover:shadow-lg hover:shadow-black/5 hover:border-border-hover">
      <Header
        title={title}
        description={description}
        category={category}
        localEnabled={localEnabled}
        isToggling={isToggling}
        todayCheckedIn={localHealth.todayCheckedIn}
        remoteHeartbeatLagging={localHealth.remoteHeartbeatLagging}
        consecutiveFailures={localHealth.consecutiveFailures}
        onToggle={handleToggle}
        isGuest={isGuest}
        onEdit={onEdit}
        onDelete={() => setShowDeleteConfirm(true)}
        serviceName={serviceName}
      />

      <Stats
        stats={localHealth.stats}
        displayStatus={displayStatus}
        remoteHeartbeatAt={localHealth.remoteHeartbeatAt}
        remoteHeartbeatLagging={localHealth.remoteHeartbeatLagging}
        consecutiveFailures={localHealth.consecutiveFailures}
      />

      <Actions
        displayStatus={displayStatus === 'deleting' ? 'loading' : displayStatus}
        onRun={handleRun}
        isGuest={isGuest}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export const TaskCard = memo(TaskCardComponent);
