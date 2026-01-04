'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { Footer } from '@/components/Footer';
import { TaskCard } from '@/components/TaskCard';
import { APP_VERSION } from '@/config/constants';
import type { HealthCheckResponse, ServiceHealth } from '@/types';
import { Check, Eye, EyeOff, Key, Save } from 'lucide-react';

// SWR fetcher 函数
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [appKey, setAppKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // 初始化时从 localStorage 加载密钥
  useEffect(() => {
    const savedKey = localStorage.getItem('app-key');
    if (savedKey) {
      // 满足 lint 规则：避免在 Effect 中同步触发渲染级联
      setTimeout(() => {
        setAppKey(savedKey);
        setIsKeySaved(true);
      }, 0);
    }
  }, []);

  const saveKey = useCallback(() => {
    localStorage.setItem('app-key', appKey);
    setIsKeySaved(true);
  }, [appKey]);

  // 使用 SWR 获取健康数据
  const { data, error, mutate } = useSWR<HealthCheckResponse>('/api/health', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
  });

  // 派生服务健康状态
  const supabaseHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.supabase || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0 },
      },
    [data]
  );

  const leanCloudHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.leancloud || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0 },
      },
    [data]
  );

  const gladosHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.glados || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0 },
      },
    [data]
  );

  // 计算系统状态和失败服务
  const systemStatus = data?.status || 'Checking';
  const failingServices = useMemo(() => {
    const failing: string[] = [];
    if (supabaseHealth.status === 'outage' || supabaseHealth.status === 'misconfigured') {
      failing.push('Supabase');
    }
    if (leanCloudHealth.status === 'outage' || leanCloudHealth.status === 'misconfigured') {
      failing.push('LeanCloud');
    }
    if (gladosHealth.status === 'outage' || gladosHealth.status === 'misconfigured') {
      failing.push('GLaDOS');
    }
    return failing;
  }, [supabaseHealth.status, leanCloudHealth.status, gladosHealth.status]);

  if (error) console.error('Health check failed:', error);

  return (
    <main className="min-h-screen py-8 px-6 sm:px-12 bg-[#fdfcf8] flex flex-col justify-center">
      <div className="w-full max-w-3xl mx-auto">
        {/* Header Section */}
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-medium text-[#191919] mb-3 font-serif tracking-tight leading-tight">
            System Operations
          </h1>
          <p className="text-base text-[#555555] max-w-xl leading-relaxed font-light mx-auto sm:mx-0">
            Control center for automated maintenance protocols and cross-service data
            synchronization.
          </p>
        </header>

        {/* Key Configuration Section */}
        <section className="mb-8 p-4 bg-white border border-[#e5e5e0] rounded-lg">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#191919] font-medium min-w-[100px]">
              <Key className="w-4 h-4" />
              <span>App Key</span>
            </div>
            <div className="flex flex-1 gap-2 w-full">
              <div className="relative flex-1 flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  id="app-key-input"
                  value={appKey}
                  onChange={e => {
                    setAppKey(e.target.value);
                    setIsKeySaved(false);
                  }}
                  placeholder="Enter access key for manual tasks..."
                  className="w-full pl-3 pr-10 py-1.5 bg-[#f9f9f9] border border-[#e5e5e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-[#999999]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-[#888888] hover:text-[#191919] transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={saveKey}
                className={`px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${
                  isKeySaved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#191919] text-white hover:bg-[#333333]'
                }`}
              >
                {isKeySaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isKeySaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          {!isKeySaved && appKey && (
            <p className="text-[11px] text-amber-600 mt-2 font-medium">
              You have unsaved changes. Remember to click save to update your local session.
            </p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6">
          <TaskCard
            category="Database Maintenance"
            title="Supabase"
            description="Triggers the daily activity signal to prevent project suspension."
            endpoint="/api/supabase-keep-alive"
            method="POST"
            serviceHealth={supabaseHealth}
            serviceName="supabase"
            appKey={appKey}
            onStatsUpdate={() => mutate()}
          />

          <TaskCard
            category="Data Synchronization"
            title="LeanCloud"
            description="Initiates a connection to the international data cluster."
            endpoint="/api/leancloud-keep-alive"
            method="POST"
            serviceHealth={leanCloudHealth}
            serviceName="leancloud"
            appKey={appKey}
            onStatsUpdate={() => mutate()}
          />

          <TaskCard
            category="Daily Check-in"
            title="GLaDOS"
            description="Automated daily check-in service for GLaDOS network access."
            endpoint="/api/glados-checkin"
            method="POST"
            serviceHealth={gladosHealth}
            serviceName="glados"
            appKey={appKey}
            onStatsUpdate={() => mutate()}
          />
        </div>

        {/* Footer */}
        <Footer
          version={APP_VERSION}
          systemStatus={systemStatus}
          failingServices={failingServices}
          serviceStatuses={{
            supabase: supabaseHealth.status,
            leancloud: leanCloudHealth.status,
            glados: gladosHealth.status,
          }}
        />
      </div>
    </main>
  );
}
