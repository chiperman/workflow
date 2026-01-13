'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import { Footer } from '@/components/Footer';
import { TaskCard } from '@/components/TaskCard';
import { APP_VERSION } from '@/config/constants';
import type { HealthCheckResponse, ServiceHealth } from '@/types';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

// SWR fetcher 函数
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };
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
        <header className="mb-8 relative">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl sm:text-4xl font-medium text-[#191919] font-serif tracking-tight leading-tight">
              System Operations
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1 text-[10px] font-medium tracking-tight text-[#888888] border border-[#e5e5e0] rounded-full hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-all duration-300"
              title="End session"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </button>
          </div>
          <p className="text-base text-[#555555] max-w-xl leading-relaxed font-light text-center sm:text-left">
            Control center for automated maintenance protocols and cross-service data
            synchronization.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <TaskCard
            category="Database Maintenance"
            title="Supabase"
            description="Triggers the daily activity signal to prevent project suspension."
            endpoint="/api/supabase-keep-alive"
            method="POST"
            serviceHealth={supabaseHealth}
            serviceName="supabase"
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
