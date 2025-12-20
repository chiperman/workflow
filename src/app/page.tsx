'use client';

import { useState, useEffect } from 'react';
import { Play, Check, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

// Define types for stats
interface ServiceStats {
  auto_count: number;
  manual_count: number;
}

interface ServiceHealth {
  status: 'operational' | 'misconfigured' | 'outage' | 'unknown';
  tableExists?: boolean;
  stats: ServiceStats;
  message?: string;
}

interface TaskCardProps {
  title: string;
  description: string;
  endpoint: string;
  category: string;
  method: 'GET' | 'POST';
  serviceHealth: ServiceHealth;
  onStatsUpdate: (newHealth: ServiceHealth) => void;
}

// Rolling Number Component (Fixed Animation Logic)
function RollingNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  // 当 value 变化时，总是更新 nextValue
  useEffect(() => {
    if (value !== displayValue) {
      setNextValue(value);

      // 只有在没有动画时才启动新动画
      if (!isAnimating) {
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setDisplayValue(value);
          setIsAnimating(false);
        }, 550);
        return () => clearTimeout(timer);
      }
    }
  }, [value]);

  // 当动画结束时，检查是否有待处理的更新
  useEffect(() => {
    if (!isAnimating && nextValue !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(nextValue);
        setIsAnimating(false);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, nextValue, displayValue]);

  return (
    <span className="relative inline-flex h-[1.25em] overflow-hidden align-bottom">
      <span
        className={`flex flex-col ${isAnimating ? 'transition-transform duration-500 ease-in-out -translate-y-1/2' : ''}`}
        style={{ height: '2.5em' }}
      >
        <span className="h-[1.25em] leading-[1.25em] block text-center min-w-[1ch]">{displayValue}</span>
        <span className="h-[1.25em] leading-[1.25em] block text-center min-w-[1ch]">{nextValue}</span>
      </span>
    </span>
  );
}

function TaskCard({ title, description, endpoint, category, method, serviceHealth, onStatsUpdate }: TaskCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showCreateGuide, setShowCreateGuide] = useState(false);

  // Supabase table creation SQL
  const supabaseCreateTableSQL = `-- Create keep_alive table
CREATE TABLE IF NOT EXISTS keep_alive (
  id INTEGER PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0
);

-- Insert initial record
INSERT INTO keep_alive (id, timestamp, manual_count, auto_count)
VALUES (1, NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (without creating policies)
-- Service role automatically bypasses RLS
-- Anon key and regular users cannot access this table
ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;`;

  // LeanCloud class creation REST API command
  const leanCloudCreateClassCommand = `# Create keep_alive class using REST API
# Replace YOUR_APP_ID, YOUR_APP_KEY, and YOUR_SERVER_URL with your credentials

curl -X POST \\
  -H "X-LC-Id: YOUR_APP_ID" \\
  -H "X-LC-Key: YOUR_APP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "auto_count": 0,
    "manual_count": 0
  }' \\
  https://YOUR_SERVER_URL/1.1/classes/keep_alive`;

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('✓ SQL copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Failed to copy SQL');
    }
  };

  // React to global health status
  useEffect(() => {
    if (serviceHealth.status === 'outage' || serviceHealth.status === 'misconfigured') {
      // 只在不是 loading 状态时设置错误状态
      // 避免覆盖用户点击 Run Task 后的 loading 状态
      if (status !== 'loading') {
        setStatus('error');
      }

      // 检查是否是表不存在的错误
      // 只要 tableExists 为 false，就显示创建引导
      const isTableMissing = serviceHealth.tableExists === false;

      if (isTableMissing) {
        setShowCreateGuide(true);
        // 根据服务类型显示不同的提示
        if (title === 'Supabase') {
          setMessage('Table does not exist. Click the copy button below to get the SQL statement.');
        } else if (title === 'LeanCloud') {
          setMessage('Class does not exist. Click "Run Task" to create it automatically.');
        }
      } else if (serviceHealth.message) {
        setShowCreateGuide(false);
        setMessage(serviceHealth.message);
      } else {
        setShowCreateGuide(false);
        const defaultMessage = serviceHealth.status === 'misconfigured'
          ? 'Configuration error: Please check your settings.'
          : 'Service is currently unavailable.';
        setMessage(defaultMessage);
      }
    } else if (serviceHealth.status === 'operational') {
      // 服务正常时，清除所有错误状态
      if (status === 'error') {
        setStatus('idle');
      }
      setMessage('');
      setShowCreateGuide(false);
    }
  }, [serviceHealth, title]);  // 移除 status 从依赖数组，避免循环更新

  const handleRun = async () => {
    // Prevent multiple simultaneous requests
    if (status === 'loading') {
      console.log(`[TaskCard: ${title}] Request already in progress, ignoring click`);
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}trigger=manual`;
      const response = await fetch(url, { method });
      const data = await response.json();

      console.log(`[TaskCard: ${title}] API Response:`, data);

      if (response.ok && (data.success || data.status === 'success' || data.data)) {
        setStatus('success');
        setMessage(data.message || 'Task completed successfully');

        // Update stats and service health status
        if (data.data) {
          console.log(`[TaskCard: ${title}] Applying new stats:`, data.data);
          // 更新完整的服务健康状态
          onStatsUpdate({
            status: 'operational',
            tableExists: true,
            stats: data.data,
            message: undefined
          });
          // 清除错误状态和创建引导
          setShowCreateGuide(false);
        }
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'Unknown error occurred');

        // Update service health to reflect the failure
        // Reset counts to 0 since the operation failed (likely table doesn't exist)
        onStatsUpdate({
          status: response.status === 500 ? 'outage' : 'misconfigured',
          tableExists: false,
          stats: { auto_count: 0, manual_count: 0 },
          message: data.message || data.error
        });
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Network error');

      // Update service health to reflect network error
      onStatsUpdate({
        status: 'outage',
        tableExists: false,
        stats: { auto_count: 0, manual_count: 0 },
        message: error.message || 'Network error'
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
            <span className={`text-[10px] uppercase font-bold tracking-wider ${status === 'error' ? 'text-red-500' : status === 'success' ? 'text-emerald-600' : 'text-amber-500'}`}>
              {status === 'loading' ? 'Running...' : status === 'error' ? 'Failed' : 'Operational'}
            </span>
          )}
        </div>
        <h2 className="text-xl font-medium text-[#191919] mb-2 font-serif">
          {title}
        </h2>
        <p className="text-[#555555] leading-relaxed text-sm">
          {description}
        </p>

        <div className="flex gap-4 mt-4 text-xs font-mono text-[#888888] uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-blue-400'}`}></span>
            <span>Auto: <RollingNumber value={serviceHealth.stats.auto_count} /></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
            <span>Manual: <RollingNumber value={serviceHealth.stats.manual_count} /></span>
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
              ${status === 'loading'
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
          <div className={`mt-4 flex items-start gap-2 text-sm font-mono ${status === 'error' ? 'text-[#9f3e3e]' : 'text-[#3f6212]'}`}>
            <span className="mt-0.5 shrink-0">
              {status === 'success' && <Check className="w-4 h-4" />}
              {status === 'error' && <AlertCircle className="w-4 h-4" />}
            </span>
            <p className="leading-relaxed">{message}</p>
          </div>
        )}

        {/* 表创建引导 */}
        {showCreateGuide && title === 'Supabase' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">Table Setup Required</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Supabase requires manual table creation. Copy the SQL below and execute it in your Supabase SQL Editor.
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(supabaseCreateTableSQL)}
              className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium rounded border border-amber-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy SQL Statement
            </button>
          </div>
        )}

        {showCreateGuide && title === 'LeanCloud' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Class Setup Options</p>
                <p className="text-xs text-blue-700 leading-relaxed mb-2">
                  <strong>Option 1 (Recommended):</strong> Click "Run Task" below and LeanCloud will automatically create the class.
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Option 2:</strong> Manually create the class using the REST API command below.
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(leanCloudCreateClassCommand)}
              className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-medium rounded border border-blue-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy REST API Command
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [systemStatus, setSystemStatus] = useState<'Operational' | 'Degraded' | 'Checking'>('Checking');
  const [supabaseHealth, setSupabaseHealth] = useState<ServiceHealth>({
    status: 'unknown',
    stats: { auto_count: 0, manual_count: 0 }
  });
  const [leanCloudHealth, setLeanCloudHealth] = useState<ServiceHealth>({
    status: 'unknown',
    stats: { auto_count: 0, manual_count: 0 }
  });
  const [version, setVersion] = useState('v0.2.0');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 单次请求获取所有健康和统计数据
        const healthRes = await fetch('/api/health');
        const healthData = await healthRes.json();

        console.log('Health Data:', healthData);

        // 从统一响应中提取数据
        const { status, services } = healthData;

        // 更新整体状态
        setSystemStatus(status || 'Checking');

        // 更新服务健康信息（包含状态、统计和错误消息）
        setSupabaseHealth(services.supabase);
        setLeanCloudHealth(services.leancloud);

      } catch (e) {
        console.error('Failed to fetch health data:', e);
        setSystemStatus('Degraded');
      }
    };

    fetchData();
  }, []);

  // 监听服务健康状态变化，自动更新全局状态
  useEffect(() => {
    // 计算整体系统状态
    const supabaseOk = supabaseHealth.status === 'operational';
    const leanCloudOk = leanCloudHealth.status === 'operational';

    if (supabaseOk && leanCloudOk) {
      setSystemStatus('Operational');
    } else if (supabaseHealth.status === 'unknown' || leanCloudHealth.status === 'unknown') {
      setSystemStatus('Checking');
    } else {
      setSystemStatus('Degraded');
    }
  }, [supabaseHealth.status, leanCloudHealth.status]);

  const failingServices = [
    supabaseHealth.status !== 'operational' && supabaseHealth.status !== 'unknown' ? 'Supabase' : null,
    leanCloudHealth.status !== 'operational' && leanCloudHealth.status !== 'unknown' ? 'LeanCloud' : null
  ].filter(Boolean);

  return (
    <main className="min-h-screen py-8 px-6 sm:px-12 bg-[#fdfcf8] flex flex-col justify-center">
      <div className="w-full max-w-3xl mx-auto">

        {/* Header Section */}
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-medium text-[#191919] mb-3 font-serif tracking-tight leading-tight">
            System Operations
          </h1>
          <p className="text-base text-[#555555] max-w-xl leading-relaxed font-light mx-auto sm:mx-0">
            Control center for automated maintenance protocols and cross-service data synchronization.
          </p>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          <TaskCard
            category="Database Maintenance"
            title="Supabase"
            description="Triggers the daily activity signal to prevent project suspension."
            endpoint="/api/manual-trigger"
            method="POST"
            serviceHealth={supabaseHealth}
            onStatsUpdate={setSupabaseHealth}
          />

          <TaskCard
            category="Data Synchronization"
            title="LeanCloud"
            description="Initiates a connection to the international data cluster."
            endpoint="/api/leancloud-keep-alive"
            method="GET"
            serviceHealth={leanCloudHealth}
            onStatsUpdate={setLeanCloudHealth}
          />
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-[#e5e5e0] flex flex-col md:flex-row items-center justify-between text-xs text-[#888888] tracking-widest uppercase gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${systemStatus === 'Operational' ? 'bg-emerald-500' :
                systemStatus === 'Checking' ? 'bg-gray-400 animate-pulse' : 'bg-amber-500'
                }`}></span>
              <div className="flex gap-1">
                <span className="font-semibold">Status: {systemStatus}</span>
                {failingServices.length > 0 && (
                  <span className="text-amber-600">
                    ({failingServices.join(', ')} Unhealthy)
                  </span>
                )}
              </div>
            </div>
            <p>Workflow {version} • Antigravity</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="text-[10px] text-[#a0a09a]">Powered By</span>
            <div className="flex items-center gap-6">
              <a href="https://nextjs.org" target="_blank" rel="noreferrer" title="Vercel" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                {/* Invert the white Vercel logo to make it visible on the light theme always */}
                <img src="/vercel.svg" alt="Vercel" className="h-4 w-auto invert" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" title="GitHub" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src="/github.svg" alt="GitHub" className="h-5 w-auto" />
              </a>
              <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noreferrer" title="Gemini" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src="/gemini-color.svg" alt="Gemini" className="h-5 w-auto" />
              </a>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
