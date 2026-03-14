'use client';

import type { ServiceHealth } from '@/types';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Actions } from './Actions';
import { Header } from './Header';
import { Message } from './Message';
import { Stats } from './Stats';

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
  method: 'GET' | 'POST';
  serviceHealth: ServiceHealth;
  serviceName: string;
  onStatsUpdate: (newHealth: ServiceHealth) => void;
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
  const [localStatus, setLocalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [localMessage, setLocalMessage] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(serviceHealth.enabled ?? true);
  const [isDismissed, setIsDismissed] = useState(false);

  // 同步 props 变化到 local state，并自动重置卡片执行状态
  useEffect(() => {
    if (serviceHealth.enabled !== undefined) {
      setLocalEnabled(serviceHealth.enabled);
    }

    // 如果卡片目前处于成功或失败的展示状态，延时 3 秒后自动重置回 idle
    // 使得全局刷新能够正确响应和接管卡片表现
    if (localStatus === 'success' || localStatus === 'error') {
      const timer = setTimeout(() => {
        setLocalStatus('idle');
        setLocalMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [serviceHealth.enabled, serviceHealth.status, localStatus]);

  // 计算最终状态
  const displayStatus = useMemo(() => {
    if (localStatus !== 'idle') return localStatus;
    if (serviceHealth.status === 'outage' || serviceHealth.status === 'misconfigured')
      return 'error';
    if (serviceHealth.status === 'operational') return 'idle';
    return 'idle';
  }, [localStatus, serviceHealth.status]);

  // 计算原始消息
  const rawMessage = useMemo(() => {
    if (localMessage) return localMessage;
    if (serviceHealth.message) return serviceHealth.message;
    if (serviceHealth.status === 'misconfigured') return 'Configuration error detected.';
    if (serviceHealth.status === 'outage') return 'Service is currently unavailable.';
    return '';
  }, [localMessage, serviceHealth.message, serviceHealth.status]);

  // 当原始消息变化时，重置关闭状态
  useEffect(() => {
    setIsDismissed(false);
  }, [rawMessage]);

  const displayMessage = isDismissed ? '' : rawMessage;

  const handleRun = useCallback(async () => {
    if (localStatus === 'loading') return;

    setLocalStatus('loading');
    setLocalMessage('');
    setIsDismissed(false);

    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, {
        method,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setLocalStatus('success');
        setLocalMessage(data.message || 'Task completed successfully');

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
        setLocalMessage(data.message || data.error || 'Execution failed');
      }
    } catch (error: unknown) {
      setLocalStatus('error');
      setLocalMessage(error instanceof Error ? error.message : 'Network failure');
    }
  }, [endpoint, method, localStatus, onStatsUpdate]);

  const handleToggle = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    setLocalMessage('');
    const newEnabled = !localEnabled;
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
        setLocalEnabled(newEnabled);
        setLocalStatus('success');
        setLocalMessage(newEnabled ? 'Auto cron enabled' : 'Auto cron disabled');
        onStatsUpdate({ ...serviceHealth, enabled: newEnabled });
      } else {
        setLocalStatus('error');
        setLocalMessage(data.message || 'Failed to toggle service');
      }
    } catch (error: unknown) {
      setLocalStatus('error');
      setLocalMessage(error instanceof Error ? error.message : 'Network failure');
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, localEnabled, serviceName, serviceHealth, onStatsUpdate]);

  return (
    <div className="group relative flex flex-col h-full bg-white border border-[#e5e5e0] p-6 rounded-lg transition-all hover:shadow-sm">
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
        serviceName={serviceName}
      />

      <Stats stats={serviceHealth.stats} displayStatus={displayStatus} />

      <Actions displayStatus={displayStatus} onRun={handleRun} isGuest={isGuest} />

      <Message
        message={displayMessage}
        displayStatus={displayStatus}
        onDismiss={() => setIsDismissed(true)}
      />
    </div>
  );
}

export const TaskCard = memo(TaskCardComponent);
