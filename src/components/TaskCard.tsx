'use client';

import type { ServiceHealth } from '@/types';
import { AlertCircle, Check, Loader2, Play } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { CreateGuide } from './CreateGuide';
import { RollingNumber } from './RollingNumber';

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
  method: 'GET' | 'POST';
  serviceHealth: ServiceHealth;
  serviceName: string;
  appKey?: string;
  onStatsUpdate: (newHealth: ServiceHealth) => void;
}

/**
 * 任务卡片组件
 *
 * 优化后的版本：
 * 1. 简化了 derived state 逻辑
 * 2. 统一了手动触发与自动刷新的反馈逻辑
 * 3. 使用 useCallback 保证性能
 */
function TaskCardComponent({
  title,
  description,
  endpoint,
  category,
  method,
  serviceHealth,
  serviceName,
  appKey,
  onStatsUpdate,
}: TaskCardProps) {
  const [localStatus, setLocalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [localMessage, setLocalMessage] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(serviceHealth.enabled ?? true);

  // 计算最终状态
  const displayStatus = useMemo(() => {
    if (localStatus !== 'idle') return localStatus;
    if (serviceHealth.status === 'outage' || serviceHealth.status === 'misconfigured')
      return 'error';
    if (serviceHealth.status === 'operational') return 'idle'; // 正常时，手动操作前显示 idle
    return 'idle';
  }, [localStatus, serviceHealth.status]);

  // 计算最终消息
  const displayMessage = useMemo(() => {
    if (localMessage) return localMessage;
    if (serviceHealth.message) return serviceHealth.message;
    if (serviceHealth.status === 'misconfigured') return 'Configuration error detected.';
    if (serviceHealth.status === 'outage') return 'Service is currently unavailable.';
    return '';
  }, [localMessage, serviceHealth.message, serviceHealth.status]);

  const showCreateGuide = useMemo(() => {
    return (
      (serviceHealth.tableExists === false || serviceHealth.status === 'misconfigured') &&
      serviceHealth.status !== 'operational'
    );
  }, [serviceHealth.tableExists, serviceHealth.status]);

  const handleRun = useCallback(async () => {
    if (localStatus === 'loading') return;

    setLocalStatus('loading');
    setLocalMessage('');

    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, {
        method,
        headers: {
          ...(appKey && { 'X-App-Key': appKey }),
        },
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
  }, [endpoint, method, appKey, localStatus, onStatsUpdate]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLocalMessage('✓ SQL copied to clipboard!');
      setTimeout(() => setLocalMessage(''), 2000);
    } catch (_err) {
      setLocalMessage('Failed to copy SQL');
    }
  }, []);

  const handleToggle = useCallback(async () => {
    if (isToggling || !appKey) return;
    setIsToggling(true);
    setLocalMessage('');
    const newEnabled = !localEnabled;
    try {
      const res = await fetch('/api/service-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Key': appKey,
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
  }, [isToggling, appKey, localEnabled, serviceName, serviceHealth, onStatsUpdate]);

  return (
    <div
      className={`flex flex-col h-full bg-white border border-[#e5e5e0] p-6 rounded-lg transition-all hover:shadow-sm ${!localEnabled ? 'opacity-60' : ''}`}
    >
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider uppercase text-[#6b6b6b] block">
              {category}
            </span>
            {!localEnabled && (
              <span className="text-[9px] font-bold tracking-wider uppercase text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                Auto: OFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {displayStatus !== 'idle' && (
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  displayStatus === 'error'
                    ? 'text-red-500'
                    : displayStatus === 'success'
                      ? 'text-emerald-600'
                      : 'text-amber-500'
                }`}
              >
                {displayStatus === 'loading'
                  ? 'Running...'
                  : displayStatus === 'error'
                    ? 'Failed'
                    : 'Success'}
              </span>
            )}
            {appKey && (
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${localEnabled ? 'bg-emerald-500' : 'bg-gray-300'} ${isToggling ? 'opacity-50' : ''}`}
                title={localEnabled ? 'Disable auto cron' : 'Enable auto cron'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${localEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            )}
          </div>
        </div>
        <h2 className="text-xl font-medium text-[#191919] mb-2 font-serif">{title}</h2>
        <p className="text-[#555555] leading-relaxed text-sm">{description}</p>

        <div className="flex gap-4 mt-4 text-xs font-mono text-[#888888] uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'error' ? 'bg-red-500' : 'bg-blue-400'}`}
            ></span>
            <span>
              Auto: <RollingNumber value={serviceHealth.stats.auto_count} />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`}
            ></span>
            <span>
              Manual: <RollingNumber value={serviceHealth.stats.manual_count} />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-[#f0f0ed]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleRun}
            disabled={displayStatus === 'loading'}
            className={`
              group flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200
              ${
                displayStatus === 'loading'
                  ? 'bg-[#e5e5e0] text-[#888888] cursor-not-allowed'
                  : 'bg-[#191919] text-[#fdfcf8] hover:bg-[#333333] active:translate-y-0.5'
              }
            `}
          >
            {displayStatus === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Run Task
          </button>
        </div>

        {displayMessage && (
          <div
            className={`mt-4 flex items-start gap-2 text-sm font-mono ${displayStatus === 'error' ? 'text-[#9f3e3e]' : 'text-[#3f6212]'}`}
          >
            <span className="mt-[2px] shrink-0">
              {(displayStatus === 'success' ||
                (displayStatus === 'idle' && displayMessage.includes('✓'))) && (
                <Check className="w-4 h-4" />
              )}
              {displayStatus === 'error' && <AlertCircle className="w-4 h-4" />}
            </span>
            <p className="leading-relaxed">{displayMessage}</p>
          </div>
        )}

        <CreateGuide
          service={title === 'Supabase' || title === 'GLaDOS' ? 'supabase' : 'leancloud'}
          show={showCreateGuide}
          onCopy={copyToClipboard}
        />
      </div>
    </div>
  );
}

export const TaskCard = memo(TaskCardComponent);
