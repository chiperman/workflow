'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  const [isExiting, setIsExiting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsExiting(true);
    await fetch('/api/auth', { method: 'DELETE' });

    // 等待离场动画完成再跳转
    setTimeout(() => {
      router.push('/login');
      router.refresh();
    }, 500);
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
    <div className="min-h-screen bg-transparent overflow-hidden relative">
      <AnimatePresence>
        {!isExiting && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="py-8 px-6 sm:px-12 flex flex-col justify-center min-h-screen"
          >
            <div className="w-full max-w-3xl mx-auto">
              {/* Header Section */}
              <header className="mb-8 relative">
                <div className="flex justify-between items-start mb-4">
                  <motion.h1
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl sm:text-4xl font-medium text-[#191919] font-serif tracking-tight leading-tight"
                  >
                    System Operations
                  </motion.h1>
                  <motion.button
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-2 px-3 py-1 text-[10px] font-medium tracking-tight text-[#888888] border border-[#e5e5e0] rounded-full hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-all duration-300"
                    title="End session"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign out</span>
                  </motion.button>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-[#555555] max-w-xl leading-relaxed font-light text-center sm:text-left"
                >
                  Control center for automated maintenance protocols and cross-service data
                  synchronization.
                </motion.p>
              </header>

              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.3,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-6"
              >
                {[
                  {
                    category: 'Database Maintenance',
                    title: 'Supabase',
                    description:
                      'Triggers the daily activity signal to prevent project suspension.',
                    endpoint: '/api/supabase-keep-alive',
                    method: 'POST' as const,
                    serviceHealth: supabaseHealth,
                    serviceName: 'supabase',
                  },
                  {
                    category: 'Data Synchronization',
                    title: 'LeanCloud',
                    description: 'Initiates a connection to the international data cluster.',
                    endpoint: '/api/leancloud-keep-alive',
                    method: 'POST' as const,
                    serviceHealth: leanCloudHealth,
                    serviceName: 'leancloud',
                  },
                  {
                    category: 'Daily Check-in',
                    title: 'GLaDOS',
                    description: 'Automated daily check-in service for GLaDOS network access.',
                    endpoint: '/api/glados-checkin',
                    method: 'POST' as const,
                    serviceHealth: gladosHealth,
                    serviceName: 'glados',
                  },
                ].map(task => (
                  <motion.div
                    key={task.title}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
                      },
                    }}
                  >
                    <TaskCard {...task} onStatsUpdate={() => mutate()} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
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
              </motion.div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="End Session"
        message="You're about to sign out. Any unsaved progress may be lost."
        confirmText="Sign out"
        cancelText="Stay"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
