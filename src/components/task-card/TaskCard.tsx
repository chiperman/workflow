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
  onStatsUpdate: (newHealth?: ServiceHealth) => void;
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

  // 同步 props 变化到 local state
  useEffect(() => {
    if (serviceHealth.enabled !== undefined) {
      setLocalEnabled(serviceHealth.enabled);
    }
  }, [serviceHealth.enabled]);

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
    if (serviceHealth.status === 'outage' || serviceHealth.status === 'misconfigured')
      return 'error';
    if (serviceHealth.status === 'operational') return 'idle';
    return 'idle';
  }, [localStatus, serviceHealth.status]);

  const handleRun = useCallback(async () => {
    if (localStatus === 'loading') return;

    setLocalStatus('loading');

    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, {
        method,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setLocalStatus('success');
        toast.success(data.message || `${title} executed successfully`);

        if (data.data) {
          onStatsUpdate({
            status: 'operational',
            tableExists: true,
            stats: data.data,
            message: undefined,
          });
        }
      } else {
        setLocalStatus('error');
        toast.error(data.message || data.error || `${title} execution failed`);
      }
    } catch (error: unknown) {
      setLocalStatus('error');
      toast.error(error instanceof Error ? error.message : 'Network failure');
    }
  }, [endpoint, method, localStatus, title, onStatsUpdate]);

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
        onStatsUpdate({ ...serviceHealth, enabled: newEnabled });
        success = true;
      } else {
        toast.error(data.message || 'Failed to toggle service');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Network failure');
    } finally {
      setIsToggling(false);
      if (success) {
        toast.success(newEnabled ? 'Auto cron enabled' : 'Auto cron disabled');
      }
    }
  }, [isToggling, localEnabled, serviceName, serviceHealth, onStatsUpdate]);

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setLocalStatus('deleting');
    try {
      const res = await fetch(`/api/service-config?service=${serviceName}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Task deleted');
        onStatsUpdate(undefined); // Trigger refresh
      } else {
        setLocalStatus('error');
        toast.error(data.message || 'Failed to delete task');
      }
    } catch (error: unknown) {
      setLocalStatus('error');
      toast.error(error instanceof Error ? error.message : 'Network failure');
    }
  }, [serviceName, onStatsUpdate]);

  return (
    <div className="group relative flex flex-col h-full bg-white border border-border-custom p-6 rounded-lg transition-all duration-200 ease-out hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 hover:border-border-hover">
      <Header
        title={title}
        description={description}
        category={category}
        displayStatus={displayStatus}
        localEnabled={localEnabled}
        isToggling={isToggling}
        todayCheckedIn={serviceHealth.todayCheckedIn}
        onToggle={handleToggle}
        isGuest={isGuest}
        onEdit={onEdit}
        onDelete={() => setShowDeleteConfirm(true)}
        serviceName={serviceName}
      />

      <Stats stats={serviceHealth.stats} displayStatus={displayStatus} />

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
