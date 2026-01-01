'use client';

import { useEffect } from 'react';
import useSWR from 'swr';

import { Footer } from '@/components/Footer';
import { TaskCard } from '@/components/TaskCard';
import { APP_VERSION } from '@/config/constants';
import type { HealthCheckResponse, ServiceHealth } from '@/types';

// SWR fetcher 函数
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  // 使用 SWR 获取健康数据（仅首次加载和手动触发时刷新）
  const { data, error, mutate } = useSWR<HealthCheckResponse>(
    '/api/health',
    fetcher,
    {
      revalidateOnFocus: false,      // 窗口聚焦时不刷新
      revalidateOnReconnect: false,  // 网络重连时不刷新
      revalidateIfStale: false,      // 数据过期时不自动刷新
      revalidateOnMount: true,       // 仅组件挂载时获取一次
    }
  );

  // 直接从 data 派生状态,避免不必要的 useState 和 useEffect
  const supabaseHealth: ServiceHealth = data?.services?.supabase || {
    status: 'unknown',
    stats: { auto_count: 0, manual_count: 0 }
  };
  
  const leanCloudHealth: ServiceHealth = data?.services?.leancloud || {
    status: 'unknown',
    stats: { auto_count: 0, manual_count: 0 }
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
            onStatsUpdate={() => mutate()} // 操作完成后刷新健康数据
          />

          <TaskCard
            category="Data Synchronization"
            title="LeanCloud"
            description="Initiates a connection to the international data cluster."
            endpoint="/api/leancloud-keep-alive"
            method="GET"
            serviceHealth={leanCloudHealth}
            onStatsUpdate={() => mutate()} // 操作完成后刷新健康数据
          />
        </div>

        {/* Footer */}
        <Footer 
          version={APP_VERSION}
          systemStatus={systemStatus}
          failingServices={failingServices}
        />

      </div>
    </main>
  );
}
