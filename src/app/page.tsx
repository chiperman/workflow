'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Footer } from '@/components/Footer';
import { Heatmap } from '@/components/Heatmap';
import { TaskCard } from '@/components/task-card';
import { APP_VERSION, MOTION_CONFIG as MOTION, SERVICES } from '@/config/constants';
import type { HealthCheckResponse, ServiceHealth } from '@/types';
import { AlertCircle, Check, LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
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
    revalidateOnReconnect: true,
    revalidateIfStale: false,
    revalidateOnMount: true,
  });

  // 派生服务健康状态
  const supabaseHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.supabase || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      },
    [data]
  );

  const gladosHealth: ServiceHealth = useMemo(
    () =>
      data?.services?.glados || {
        status: 'unknown',
        stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
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
    if (gladosHealth.status === 'outage' || gladosHealth.status === 'misconfigured') {
      failing.push('GLaDOS');
    }
    return failing;
  }, [supabaseHealth.status, gladosHealth.status]);

  if (error) console.error('Health check failed:', error);

  return (
    <div className="min-h-screen bg-transparent overflow-hidden relative">
      <AnimatePresence>
        {!isExiting && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            className="py-8 px-6 sm:px-12 flex flex-col justify-center min-h-screen"
          >
            <div className="w-full max-w-3xl mx-auto">
              {/* Header Section */}
              <header className="mb-8 relative">
                <div className="flex justify-between items-center mb-4">
                  <motion.h1
                    initial={{ opacity: 0, y: MOTION.yOffset }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: MOTION.delay.header,
                      duration: MOTION.duration,
                      ease: MOTION.ease,
                    }}
                    className="text-3xl sm:text-4xl font-medium text-[#191919] font-serif tracking-tight leading-tight"
                  >
                    System Operations
                  </motion.h1>
                  <div className="flex items-center gap-3">
                    <motion.button
                      initial={{ opacity: 0, y: MOTION.yOffset }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: MOTION.delay.header,
                        duration: MOTION.duration,
                        ease: MOTION.ease,
                      }}
                      onClick={async () => {
                        if (refreshStatus !== 'idle') return;
                        setRefreshStatus('loading');
                        try {
                          await Promise.all([
                            mutate(),
                            globalMutate(
                              key =>
                                typeof key === 'string' && key.startsWith('/api/stats/heatmap'),
                              undefined,
                              { revalidate: true }
                            ),
                          ]);
                          setRefreshStatus('success');
                          setTimeout(() => setRefreshStatus('idle'), 2000);
                        } catch (err) {
                          console.error('Refresh failed:', err);
                          setRefreshStatus('error');
                          setTimeout(() => setRefreshStatus('idle'), 2000);
                        }
                      }}
                      disabled={refreshStatus !== 'idle'}
                      className={`
                      flex items-center justify-center p-2 rounded-lg border transition-colors duration-300 group
                      ${
                        refreshStatus === 'error'
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : refreshStatus === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border-[#e5e5e0] text-[#888888] hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30'
                      }
                      ${refreshStatus !== 'idle' ? 'cursor-not-allowed' : ''}
                    `}
                      title="Refresh data"
                    >
                      {refreshStatus === 'idle' ? (
                        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                      ) : (
                        <AnimatePresence mode="wait">
                          {refreshStatus === 'loading' ? (
                            <motion.div
                              key="loading"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            </motion.div>
                          ) : refreshStatus === 'success' ? (
                            <motion.div
                              key="success"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="error"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: MOTION.yOffset }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: MOTION.delay.header,
                        duration: MOTION.duration,
                        ease: MOTION.ease,
                      }}
                      onClick={() => setShowLogoutConfirm(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium tracking-tight text-[#888888] border border-[#e5e5e0] rounded-lg hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-colors duration-300"
                      title="End session"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign out</span>
                    </motion.button>
                  </div>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: MOTION.yOffset }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: MOTION.delay.description,
                    duration: MOTION.duration,
                    ease: MOTION.ease,
                  }}
                  className="text-base text-[#555555] max-w-xl leading-relaxed font-light text-center sm:text-left"
                >
                  Control center for automated maintenance protocols and cross-service data
                  synchronization.
                </motion.p>
              </header>

              {/* Heatmap Section - Now at top for better visibility */}
              <motion.div
                initial={{ opacity: 0, y: MOTION.yOffset }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: MOTION.delay.heatmap,
                  duration: MOTION.duration,
                  ease: MOTION.ease,
                }}
                className="mb-8"
              >
                <Heatmap />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: MOTION.delay.cardStagger,
                      delayChildren: MOTION.delay.cards,
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
                    serviceName: SERVICES.SUPABASE,
                  },
                  {
                    category: 'Access Protocol',
                    title: 'GLaDOS',
                    description: 'Daily check-in to maintain network permissions.',
                    endpoint: '/api/glados-checkin',
                    method: 'POST' as const,
                    serviceHealth: gladosHealth,
                    serviceName: SERVICES.GLADOS,
                  },
                ].map(task => (
                  <motion.div
                    key={task.title}
                    variants={{
                      hidden: { opacity: 0, y: MOTION.yOffset },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: MOTION.duration,
                          ease: MOTION.ease,
                        },
                      },
                    }}
                  >
                    <TaskCard
                      {...task}
                      onStatsUpdate={() => {
                        mutate(); // Refresh health data
                        // Refresh heatmap data (all years)
                        globalMutate(
                          key => typeof key === 'string' && key.startsWith('/api/stats/heatmap'),
                          undefined,
                          { revalidate: true }
                        );
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: MOTION.yOffset }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: MOTION.delay.footer,
                  duration: MOTION.duration,
                  ease: MOTION.ease,
                }}
              >
                <Footer
                  version={APP_VERSION}
                  systemStatus={systemStatus}
                  failingServices={failingServices}
                  serviceStatuses={{
                    supabase: supabaseHealth.status,
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
