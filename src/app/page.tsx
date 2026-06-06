'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Footer } from '@/components/Footer';
import { Heatmap } from '@/components/heatmap';
import { TaskCard } from '@/components/task-card';
import { TaskConfigModal } from '@/components/task-config-modal';

import { MOTION_CONFIG as MOTION, APP_VERSION } from '@/config/constants';
import { useTasks } from '@/hooks/useTasks';
import type { ServiceConfig } from '@/types';
import { Workflow, RefreshCw, Plus, LogIn, LogOut, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const MotionButton = motion(Button);

/**
 * Workflow Dashboard - 核心控制面板 (已恢复原始布局)
 */
export default function Home() {
  const router = useRouter();

  // 使用重构后的业务 Hook，但保持 UI 结构不变
  const { groupedTasks, services, refreshAll, authType, isLoading } = useTasks();

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Refresh failed:', err);
      }
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
    window.location.replace('/login');
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
            className="pt-16 pb-20 px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col min-h-screen"
          >
            <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
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
                    className="text-3xl sm:text-4xl font-medium text-foreground font-serif tracking-tight leading-tight flex items-center gap-3"
                  >
                    <Workflow
                      className="w-8 h-8 sm:w-10 sm:h-10 text-accent-primary"
                      strokeWidth={1.5}
                    />
                    <span>System Operations</span>
                  </motion.h1>
                  <div className="flex items-center gap-3">
                    {isLoading ? (
                      <div className="flex items-center gap-2 opacity-60">
                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                        <div className="w-16 h-8 rounded-lg bg-muted animate-pulse hidden sm:block" />
                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse sm:hidden" />
                      </div>
                    ) : (
                      <>
                        {isGuest && (
                          <div className="hidden sm:flex items-center px-2 py-1 rounded bg-amber-50 border border-amber-100 text-[10px] text-amber-600 font-medium">
                            Preview Mode
                          </div>
                        )}
                        <MotionButton
                          initial={{ opacity: 0, y: MOTION.yOffset }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: MOTION.delay.header,
                            duration: MOTION.duration,
                            ease: MOTION.ease,
                          }}
                          variant="outline"
                          size="icon"
                          onClick={handleRefreshClick}
                          disabled={refreshUIStatus !== 'idle' || isGuest}
                          className={`
                      transition-colors duration-300 group
                      ${
                        refreshUIStatus === 'error'
                          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                          : refreshUIStatus === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700'
                            : isGuest
                              ? 'border-[#f0f0f0] text-[#cccccc] cursor-not-allowed bg-gray-50'
                              : 'text-text-secondary hover:text-foreground hover:border-accent-primary/30'
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
                        </MotionButton>
                        {!isGuest && (
                          <MotionButton
                            initial={{ opacity: 0, y: MOTION.yOffset }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: MOTION.delay.header,
                              duration: MOTION.duration,
                              ease: MOTION.ease,
                            }}
                            variant="outline"
                            size="icon"
                            onClick={openCreateModal}
                            className="text-text-secondary hover:text-foreground hover:border-accent-primary/30 transition-colors duration-300"
                            title="Add new task"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </MotionButton>
                        )}
                        {isGuest ? (
                          <MotionButton
                            initial={{ opacity: 0, y: MOTION.yOffset }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: MOTION.delay.header,
                              duration: MOTION.duration,
                              ease: MOTION.ease,
                            }}
                            variant="outline"
                            onClick={() => router.push('/login')}
                            className="sm:justify-start gap-2 h-9 sm:px-3 text-[10px] font-medium tracking-tight text-foreground hover:border-accent-primary/30 transition-colors duration-300 whitespace-nowrap shadow-sm"
                            title="Sign in"
                            aria-label="Sign in"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign in</span>
                          </MotionButton>
                        ) : (
                          <MotionButton
                            initial={{ opacity: 0, y: MOTION.yOffset }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: MOTION.delay.header,
                              duration: MOTION.duration,
                              ease: MOTION.ease,
                            }}
                            variant="outline"
                            onClick={() => setShowLogoutConfirm(true)}
                            className="sm:justify-start gap-2 h-9 sm:px-3 text-[10px] font-medium tracking-tight text-text-secondary hover:text-foreground hover:border-accent-primary/30 transition-colors duration-300 whitespace-nowrap shadow-sm"
                            title="Sign out"
                            aria-label="Sign out"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign out</span>
                          </MotionButton>
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
                  className="text-sm text-text-tertiary max-w-xl leading-relaxed font-light text-left"
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

              {/* Task Cards List - 响应式多列布局 */}
              <div className="flex flex-col gap-12 mb-12 relative min-h-[200px]">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="flex min-h-[360px] flex-col rounded-lg border border-border-custom bg-white/80 p-5 shadow-sm shadow-black/[0.02]"
                        aria-hidden="true"
                      >
                        <div className="mb-5 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 pt-1">
                            <div
                              className="h-2.5 w-20 rounded-full bg-muted animate-shimmer"
                              style={{ animationDelay: `${i * 0.12}s` }}
                            />
                            <div
                              className="mt-6 h-7 w-4/5 rounded-md bg-muted animate-shimmer"
                              style={{ animationDelay: `${i * 0.12 + 0.08}s` }}
                            />
                            <div className="mt-4 space-y-2.5">
                              <div
                                className="h-3 w-full rounded-full bg-muted animate-shimmer"
                                style={{ animationDelay: `${i * 0.12 + 0.16}s` }}
                              />
                              <div
                                className="h-3 w-2/3 rounded-full bg-muted animate-shimmer"
                                style={{ animationDelay: `${i * 0.12 + 0.24}s` }}
                              />
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <div
                              className="h-8 w-8 rounded-md bg-muted animate-shimmer"
                              style={{ animationDelay: `${i * 0.12 + 0.12}s` }}
                            />
                            <div
                              className="h-5 w-10 rounded-full bg-muted animate-shimmer"
                              style={{ animationDelay: `${i * 0.12 + 0.2}s` }}
                            />
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-[#f0f0ed] py-3">
                          {[0, 1, 2].map(statIndex => (
                            <div key={statIndex} className="min-w-0">
                              <div className="mb-2 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#d5d5cd]" />
                                <div
                                  className="h-2.5 w-12 rounded-full bg-muted animate-shimmer"
                                  style={{ animationDelay: `${i * 0.12 + statIndex * 0.08}s` }}
                                />
                              </div>
                              <div
                                className="h-5 w-8 rounded-md bg-muted animate-shimmer"
                                style={{ animationDelay: `${i * 0.12 + statIndex * 0.08 + 0.12}s` }}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-5">
                          <div className="space-y-2">
                            <div
                              className="h-2.5 w-24 rounded-full bg-muted animate-shimmer"
                              style={{ animationDelay: `${i * 0.12 + 0.34}s` }}
                            />
                            <div
                              className="h-2.5 w-16 rounded-full bg-muted animate-shimmer"
                              style={{ animationDelay: `${i * 0.12 + 0.42}s` }}
                            />
                          </div>
                          <div
                            className="h-9 w-28 rounded-md bg-muted animate-shimmer"
                            style={{ animationDelay: `${i * 0.12 + 0.5}s` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {Object.keys(groupedTasks).length === 0 ? (
                      <motion.div
                        key="empty-state"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="flex flex-col items-center justify-center py-20 px-6 bg-white/40 backdrop-blur-sm border border-border-custom rounded-2xl"
                      >
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                          <Plus className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground mb-3 text-serif">
                          No Tasks Protocol Found
                        </h3>
                        <p className="text-sm text-text-secondary text-center max-w-sm mb-8 font-light">
                          Get started by creating your first automated maintenance protocol. Tasks
                          will run on schedule to keep your services operational.
                        </p>
                        {!isGuest && (
                          <Button variant="brand" onClick={openCreateModal} className="gap-2 h-10">
                            <Plus className="w-4 h-4" />
                            Initialize First Protocol
                          </Button>
                        )}
                      </motion.div>
                    ) : (
                      Object.entries(groupedTasks).map(([category, tasks], groupIndex) => (
                        <div key={category} className="flex flex-col gap-6">
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: groupIndex * 0.1,
                              duration: 0.5,
                            }}
                            className="flex items-center gap-3"
                          >
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary pl-1">
                              {category}
                            </h2>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-border-custom to-transparent" />
                          </motion.div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {tasks.map((task, index) => (
                              <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                  delay: groupIndex * 0.1 + index * MOTION.delay.cardStagger,
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
                          </div>
                        </div>
                      ))
                    )}
                  </AnimatePresence>
                )}
              </div>

              <Footer version={APP_VERSION} />
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <TaskConfigModal
        key={editingServiceId || 'new'}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        serviceId={editingServiceId || undefined}
        initialConfig={
          editingServiceId && services[editingServiceId]
            ? ({
                ...services[editingServiceId],
                service: editingServiceId,
              } as unknown as Partial<ServiceConfig>)
            : undefined
        }
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
