'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Footer } from '@/components/Footer';
import { Heatmap } from '@/components/Heatmap';
import { TaskCard } from '@/components/task-card';
import { TaskConfigModal } from '@/components/TaskConfigModal';

import { MOTION_CONFIG as MOTION, APP_VERSION } from '@/config/constants';
import { useTasks } from '@/hooks/useTasks';
import { Workflow, RefreshCw, Plus, LogIn, LogOut, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Workflow Dashboard - 核心控制面板 (已恢复原始布局)
 */
export default function Home() {
  const router = useRouter();

  // 使用重构后的业务 Hook，但保持 UI 结构不变
  const {
    taskCards,
    serviceStatuses,
    refreshAll,
    authType,
    isLoading,
    systemStatus,
    failingServices,
  } = useTasks();

  const isGuest = authType === 'public' || authType === 'none';

  // 状态管理
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [refreshUIStatus, setRefreshUIStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );

  // 交互处理器
  const openEditModal = (id: string) => {
    setEditingServiceId(id);
    setIsConfigOpen(true);
  };

  const openCreateModal = () => {
    setEditingServiceId(null);
    setIsConfigOpen(true);
  };

  const handleRefreshClick = async () => {
    if (refreshUIStatus !== 'idle' || isGuest) return;
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

    setTimeout(() => {
      router.push('/login');
      router.refresh();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden overflow-y-auto">
      <AnimatePresence>
        {!isExiting && (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            className="pt-16 pb-20 px-6 sm:px-12 flex flex-col min-h-screen"
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
                    className="text-3xl sm:text-4xl font-medium text-[#191919] font-serif tracking-tight leading-tight flex items-center gap-3"
                  >
                    <Workflow
                      className="w-8 h-8 sm:w-10 sm:h-10 text-[#d97757]"
                      strokeWidth={1.5}
                    />
                    <span>System Operations</span>
                  </motion.h1>
                  <div className="flex items-center gap-3">
                    {isLoading ? (
                      <div className="flex items-center gap-2 opacity-60">
                        <div className="w-8 h-8 rounded-lg bg-[#e5e5e0] animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-[#e5e5e0] animate-pulse" />
                        <div className="w-16 h-8 rounded-lg bg-[#e5e5e0] animate-pulse hidden sm:block" />
                        <div className="w-8 h-8 rounded-lg bg-[#e5e5e0] animate-pulse sm:hidden" />
                      </div>
                    ) : (
                      <>
                        {isGuest && (
                          <div className="hidden sm:flex items-center px-2 py-1 rounded bg-amber-50 border border-amber-100 text-[10px] text-amber-600 font-medium">
                            Preview Mode
                          </div>
                        )}
                        <motion.button
                          initial={{ opacity: 0, y: MOTION.yOffset }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: MOTION.delay.header,
                            duration: MOTION.duration,
                            ease: MOTION.ease,
                          }}
                          onClick={handleRefreshClick}
                          disabled={refreshUIStatus !== 'idle' || isGuest}
                          className={`
                      flex items-center justify-center p-2 rounded-lg border transition-colors duration-300 group
                      ${
                        refreshUIStatus === 'error'
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : refreshUIStatus === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : isGuest
                              ? 'border-[#f0f0f0] text-[#cccccc] cursor-not-allowed bg-gray-50'
                              : 'border-[#e5e5e0] text-[#888888] hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30'
                      }
                    `}
                          title={isGuest ? 'Sign in to refresh' : 'Refresh data'}
                        >
                          {refreshUIStatus === 'idle' ? (
                            <RefreshCw
                              className={`w-3.5 h-3.5 transition-transform duration-500 ${
                                isGuest ? '' : 'group-hover:rotate-180'
                              }`}
                            />
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
                        {!isGuest && (
                          <motion.button
                            initial={{ opacity: 0, y: MOTION.yOffset }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: MOTION.delay.header,
                              duration: MOTION.duration,
                              ease: MOTION.ease,
                            }}
                            onClick={openCreateModal}
                            className="flex items-center justify-center p-2 rounded-lg border border-[#e5e5e0] text-[#888888] hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-colors duration-300"
                            title="Add new task"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                        {isGuest ? (
                          <motion.button
                            initial={{ opacity: 0, y: MOTION.yOffset }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: MOTION.delay.header,
                              duration: MOTION.duration,
                              ease: MOTION.ease,
                            }}
                            onClick={() => router.push('/login')}
                            className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-3 sm:py-2 text-[10px] font-medium tracking-tight text-[#191919] bg-white border border-[#e5e5e0] rounded-lg hover:border-[#d97757]/30 transition-colors duration-300 whitespace-nowrap shadow-sm"
                            title="Sign in"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign in</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            initial={{ opacity: 0, y: MOTION.yOffset }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: MOTION.delay.header,
                              duration: MOTION.duration,
                              ease: MOTION.ease,
                            }}
                            onClick={() => setShowLogoutConfirm(true)}
                            className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-3 sm:py-2 text-[10px] font-medium tracking-tight text-[#888888] border border-[#e5e5e0] rounded-lg hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-colors duration-300 whitespace-nowrap shadow-sm"
                            title="Sign out"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign out</span>
                          </motion.button>
                        )}
                      </>
                    )}
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

              {/* Heatmap Section - 恢复至 Header 下方 */}
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

              {/* Task Cards List - 恢复为单列垂直布局 */}
              <div className="grid grid-cols-1 gap-6 mb-12 relative min-h-[200px]">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#d97757]/30" />
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {taskCards.map((task, index) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          delay: index * MOTION.delay.cardStagger,
                          duration: MOTION.duration,
                          ease: MOTION.ease,
                        }}
                      >
                        <TaskCard
                          {...task}
                          onStatsUpdate={() => refreshAll()}
                          onEdit={openEditModal}
                          isGuest={isGuest}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <Footer
                version={APP_VERSION}
                systemStatus={systemStatus}
                failingServices={failingServices}
                serviceStatuses={serviceStatuses}
              />
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <TaskConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        serviceId={editingServiceId || undefined}
        onSuccess={() => {
          setIsConfigOpen(false);
          refreshAll();
        }}
      />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out"
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
