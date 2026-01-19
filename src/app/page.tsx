'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Footer } from '@/components/Footer';
import { Heatmap } from '@/components/Heatmap';
import { TaskCard } from '@/components/task-card';
import { APP_VERSION, MOTION_CONFIG as MOTION, SERVICES } from '@/config/constants';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { AlertCircle, Check, LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Use Custom Hook
  const { error, supabaseHealth, gladosHealth, systemStatus, failingServices, refreshAll } =
    useSystemHealth();

  // Local refresh status for UI feedback (idle -> loading -> success/error -> idle)
  const [refreshUIStatus, setRefreshUIStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );

  const handleRefreshClick = async () => {
    if (refreshUIStatus !== 'idle') return;
    setRefreshUIStatus('loading');
    const loadingToast = toast.loading('Refreshing system data...');
    try {
      await refreshAll();
      setRefreshUIStatus('success');
      toast.success('System data refreshed', { id: loadingToast });
      setTimeout(() => setRefreshUIStatus('idle'), 2000);
    } catch (err) {
      console.error('Refresh failed:', err);
      setRefreshUIStatus('error');
      toast.error('Refresh failed', {
        id: loadingToast,
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      });
      setTimeout(() => setRefreshUIStatus('idle'), 2000);
    }
  };

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
                      onClick={handleRefreshClick}
                      disabled={refreshUIStatus !== 'idle'}
                      className={`
                      flex items-center justify-center p-2 rounded-lg border transition-colors duration-300 group
                      ${
                        refreshUIStatus === 'error'
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : refreshUIStatus === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : 'border-[#e5e5e0] text-[#888888] hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30'
                      }
                      ${refreshUIStatus !== 'idle' ? 'cursor-not-allowed' : ''}
                    `}
                      title="Refresh data"
                    >
                      {refreshUIStatus === 'idle' ? (
                        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                      ) : (
                        <AnimatePresence mode="wait">
                          {refreshUIStatus === 'loading' ? (
                            <motion.div
                              key="loading"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.5, opacity: 0 }}
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            </motion.div>
                          ) : refreshUIStatus === 'success' ? (
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
                      className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-3 sm:py-2 text-[10px] font-medium tracking-tight text-[#888888] border border-[#e5e5e0] rounded-lg hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-colors duration-300 whitespace-nowrap"
                      title="End session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sign out</span>
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
                  className="text-sm text-[#555555] max-w-xl leading-relaxed font-light text-left"
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
                    <TaskCard {...task} onStatsUpdate={refreshAll} />
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
