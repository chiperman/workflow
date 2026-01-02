'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

import { Footer } from '@/components/Footer';
import { TaskCard } from '@/components/TaskCard';
import { APP_VERSION } from '@/config/constants';
import type { HealthCheckResponse, ServiceHealth } from '@/types';
import { Check, Key, Save } from 'lucide-react';

// SWR fetcher 函数
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [appKey, setAppKey] = useState('');
  const [isKeySaved, setIsKeySaved] = useState(false);

  // 初始化时从 localStorage 加载密钥
  useEffect(() => {
    const savedKey = localStorage.getItem('app-key');
    if (savedKey) {
      // 避免同步调用以满足 Lint 规则 (react-hooks/set-state-in-effect)
      Promise.resolve().then(() => {
        setAppKey(savedKey);
        setIsKeySaved(true);
      });
    }
  }, []);

  const saveKey = () => {
    localStorage.setItem('app-key', appKey);
    setIsKeySaved(true);
  };
  // 使用 SWR 获取健康数据（仅首次加载和手动触发时刷新）
  const { data, error, mutate } = useSWR<HealthCheckResponse>('/api/health', fetcher, {
    revalidateOnFocus: false, // 窗口聚焦时不刷新
    revalidateOnReconnect: false, // 网络重连时不刷新
    revalidateIfStale: false, // 数据过期时不自动刷新
    revalidateOnMount: true, // 仅组件挂载时获取一次
  });

  // 直接从 data 派生状态,避免不必要的 useState 和 useEffect
  const supabaseHealth: ServiceHealth = data?.services?.supabase || {
    status: 'unknown',
    stats: { auto_count: 0, manual_count: 0 },
  };

  const leanCloudHealth: ServiceHealth = data?.services?.leancloud || {
    status: 'unknown',
    stats: { auto_count: 0, manual_count: 0 },
  };

  // 计算系统状态和失败服务
  const systemStatus = data?.status || 'Checking';
  const failingServices: string[] = [];

  if (supabaseHealth.status !== 'operational' && supabaseHealth.status !== 'unknown') {
    failingServices.push('Supabase');
  }
  if (leanCloudHealth.status !== 'operational' && leanCloudHealth.status !== 'unknown') {
    failingServices.push('LeanCloud');
  }

  // 错误处理
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch health data:', error);
    }
  }, [error]);

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
              <input
                type="password"
                value={appKey}
                onChange={e => {
                  setAppKey(e.target.value);
                  setIsKeySaved(false);
                }}
                placeholder="Enter access key for manual tasks..."
                className="flex-1 px-3 py-1.5 bg-[#f9f9f9] border border-[#e5e5e0] rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-[#999999]"
              />
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
            appKey={appKey}
            onStatsUpdate={() => mutate()} // 操作完成后刷新健康数据
          />

          <TaskCard
            category="Data Synchronization"
            title="LeanCloud"
            description="Initiates a connection to the international data cluster."
            endpoint="/api/leancloud-keep-alive"
            method="POST"
            serviceHealth={leanCloudHealth}
            appKey={appKey}
            onStatsUpdate={() => mutate()} // 操作完成后刷新健康数据
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
          }}
        />
      </div>
    </main>
  );
}
