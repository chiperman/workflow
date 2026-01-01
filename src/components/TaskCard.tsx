'use client';

import type { ServiceHealth } from '@/types';
import { AlertCircle, Check, Loader2, Play } from 'lucide-react';
import { memo, useState } from 'react';
import { CreateGuide } from './CreateGuide';
import { RollingNumber } from './RollingNumber';

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
  method: 'GET' | 'POST';
  serviceHealth: ServiceHealth;
  onStatsUpdate: (newHealth: ServiceHealth) => void;
}

// 辅助函数：根据 serviceHealth 计算状态
function getDerivedState(
  serviceHealth: ServiceHealth,
  currentStatus: 'idle' | 'loading' | 'success' | 'error',
  title: string
): {
  status?: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  showCreateGuide: boolean;
} | null {
  if (serviceHealth.status === 'outage' || serviceHealth.status === 'misconfigured') {
    // 如果正在加载中，不更新状态，只返回 null 表示无变更
    if (currentStatus === 'loading') {
      return null;
    }

    const isTableMissing = serviceHealth.tableExists === false;
    let message = '';
    let showCreateGuide = false;

    if (isTableMissing) {
      showCreateGuide = true;
      if (title === 'Supabase') {
        message = 'Table does not exist. Click the copy button below to get the SQL statement.';
      } else if (title === 'LeanCloud') {
        message = 'Class does not exist. Click "Run Task" to create it automatically.';
      }
    } else if (serviceHealth.message) {
      message = serviceHealth.message;
    } else {
      message =
        serviceHealth.status === 'misconfigured'
          ? 'Configuration error: Please check your settings.'
          : 'Service is currently unavailable.';
    }

    return {
      status: 'error',
      message,
      showCreateGuide,
    };
  } else if (serviceHealth.status === 'operational') {
    // 服务正常时
    return {
      status: currentStatus === 'error' ? 'idle' : undefined, // 只在错误时重置为 idle，否则保持原样 (如 success)
      message: '',
      showCreateGuide: false,
    };
  }
  return null;
}

/**
 * 任务卡片组件
 *
 * 显示服务状态、统计数据和操作按钮
 */
function TaskCardComponent({
  title,
  description,
  endpoint,
  category,
  method,
  serviceHealth,
  onStatsUpdate,
}: TaskCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showCreateGuide, setShowCreateGuide] = useState(false);
  const [prevServiceHealth, setPrevServiceHealth] = useState(serviceHealth);

  // 响应全局健康状态变化 - 使用 render-phase state update
  if (serviceHealth !== prevServiceHealth) {
    setPrevServiceHealth(serviceHealth);
    const derived = getDerivedState(serviceHealth, status, title);
    if (derived) {
      if (derived.status) setStatus(derived.status);
      setMessage(derived.message);
      setShowCreateGuide(derived.showCreateGuide);
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('✓ SQL copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (_err) {
      setMessage('Failed to copy SQL');
    }
  };

  const handleRun = async () => {
    // 防止多个同时请求
    if (status === 'loading') {
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, { method });
      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success' || data.data)) {
        setStatus('success');
        setMessage(data.message || 'Task completed successfully');

        // 更新统计数据和服务健康状态
        if (data.data) {
          onStatsUpdate({
            status: 'operational',
            tableExists: true,
            stats: data.data,
            message: undefined,
          });
          setShowCreateGuide(false);
        }
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'Unknown error occurred');

        // 更新服务健康状态以反映失败
        onStatsUpdate({
          status: response.status === 500 ? 'outage' : 'misconfigured',
          tableExists: false,
          stats: { auto_count: 0, manual_count: 0 },
          message: data.message || data.error,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setStatus('error');
      setMessage(errorMessage);

      // 更新服务健康状态以反映网络错误
      onStatsUpdate({
        status: 'outage',
        tableExists: false,
        stats: { auto_count: 0, manual_count: 0 },
        message: errorMessage,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[#e5e5e0] p-6 rounded-lg transition-shadow hover:shadow-sm">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-medium tracking-wider uppercase text-[#6b6b6b] block">
            {category}
          </span>
          {status !== 'idle' && (
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-emerald-600' : 'text-amber-500'}`}
            >
              {status === 'loading' ? 'Running...' : status === 'error' ? 'Failed' : 'Operational'}
            </span>
          )}
        </div>
        <h2 className="text-xl font-medium text-[#191919] mb-2 font-serif">{title}</h2>
        <p className="text-[#555555] leading-relaxed text-sm">{description}</p>

        <div className="flex gap-4 mt-4 text-xs font-mono text-[#888888] uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-blue-400'}`}
            ></span>
            <span>
              Auto: <RollingNumber value={serviceHealth.stats.auto_count} />
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`}
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
            disabled={status === 'loading'}
            className={`
              group flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200
              ${
                status === 'loading'
                  ? 'bg-[#e5e5e0] text-[#888888] cursor-not-allowed'
                  : 'bg-[#191919] text-[#fdfcf8] hover:bg-[#333333] active:translate-y-0.5'
              }
            `}
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Run Task
          </button>
        </div>

        {message && status !== 'idle' && (
          <div
            className={`mt-4 flex items-start gap-2 text-sm font-mono ${status === 'error' ? 'text-[#9f3e3e]' : 'text-[#3f6212]'}`}
          >
            <span className="mt-0.5 shrink-0">
              {status === 'success' && <Check className="w-4 h-4" />}
              {status === 'error' && <AlertCircle className="w-4 h-4" />}
            </span>
            <p className="leading-relaxed">{message}</p>
          </div>
        )}

        {/* 表创建引导 */}
        <CreateGuide
          service={title === 'Supabase' ? 'supabase' : 'leancloud'}
          show={showCreateGuide}
          onCopy={copyToClipboard}
        />
      </div>
    </div>
  );
}

// 使用 React.memo 优化组件，避免不必要的重新渲染
export const TaskCard = memo(TaskCardComponent);
