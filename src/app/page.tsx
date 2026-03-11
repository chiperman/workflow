'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Footer } from '@/components/Footer';
import { Heatmap } from '@/components/Heatmap';
import { TaskCard } from '@/components/task-card';
import { TaskConfigModal } from '@/components/TaskConfigModal';
import { APP_VERSION, MOTION_CONFIG as MOTION } from '@/config/constants';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import type { ServiceStatus } from '@/types';
import { AlertCircle, Check, LogIn, LogOut, Plus, RefreshCw, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | undefined>();

  const {
    error,
    services = {}, // Default to empty object
    systemStatus,
    failingServices,
    refreshAll,
    authType,
    isLoading,
  } = useSystemHealth();

  useEffect(() => {
    console.log('[Home] Rendered. Services count:', Object.keys(services).length);
    if (error) console.error('[Home] Health check error:', error);
  }, [services, error]);

  const isGuest = authType === 'public' || authType === 'none';

  const openCreateModal = () => {
    setEditingServiceId(undefined);
    setIsConfigOpen(true);
  };

  const openEditModal = (id: string) => {
    setEditingServiceId(id);
    setIsConfigOpen(true);
  };

  // Derive service statuses for footer
  const serviceStatuses = useMemo(() => {
    const statuses: Record<string, ServiceStatus | undefined> = {};
    Object.entries(services).forEach(([name, health]) => {
      statuses[name] = health.status;
    });
    return statuses;
  }, [services]);

  // Derive task configurations
  const taskCards = useMemo(() => {
    return Object.entries(services).map(([id, health]) => {
      const isInternal = health.type === 'supabase_internal' || id === 'supabase';

      return {
        id,
        title: health.name || id.charAt(0).toUpperCase() + id.slice(1),
        category: health.category || (isInternal ? 'Database Maintenance' : 'Access Protocol'),
        description: health.description || 'Automated maintenance protocol.',
        endpoint: `/api/tasks/${id}`,
        method: 'POST' as const,
        serviceHealth: health,
        serviceName: id,
      };
    });
  }, [services]);

  // Local refresh status for UI feedback
  const [refreshUIStatus, setRefreshUIStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );

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
                    className="text-3xl sm:text-4xl font-medium text-[#191919] font-serif tracking-tight leading-tight flex items-center gap-3"
                  >
                    <Workflow
                      className="w-8 h-8 sm:w-10 sm:h-10 text-[#d97757]"
                      strokeWidth={1.5}
                    />
                    <span>System Operations</span>
                  </motion.h1>
                  <div className="flex items-center gap-3">
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
                        className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-3 sm:py-2 text-[10px] font-medium tracking-tight text-[#888888] border border-[#e5e5e0] rounded-lg hover:bg-white hover:text-[#191919] hover:border-[#d97757]/30 transition-colors duration-300 whitespace-nowrap"
                        title="End session"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sign out</span>
                      </motion.button>
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

              {/* Heatmap Section */}
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

              {/* Cards Section */}
              <div className="grid grid-cols-1 gap-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading-skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      className="space-y-6 w-full"
                    >
                      {[1, 2].map(i => (
                        <div
                          key={i}
                          className="h-[280px] bg-gray-50/50 border border-[#e5e5e0] rounded-xl animate-pulse flex flex-col p-6 space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="h-3 w-20 bg-gray-200 rounded" />
                              <div className="h-6 w-32 bg-gray-200 rounded" />
                            </div>
                            <div className="h-5 w-10 bg-gray-200 rounded-full" />
                          </div>
                          <div className="h-4 w-full bg-gray-100 rounded" />
                          <div className="h-20 w-full bg-gray-50 rounded-lg mt-auto" />
                        </div>
                      ))}
                    </motion.div>
                  ) : taskCards.length > 0 ? (
                    <motion.div
                      key="content-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6 w-full"
                    >
                      {taskCards.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.1,
                          }}
                        >
                          <TaskCard
                            title={task.title}
                            category={task.category}
                            description={task.description}
                            endpoint={task.endpoint}
                            method={task.method}
                            serviceHealth={task.serviceHealth}
                            serviceName={task.serviceName}
                            onStatsUpdate={refreshAll}
                            onEdit={openEditModal}
                            isGuest={isGuest}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 border border-dashed border-[#e5e5e0] rounded-xl text-[#888888] text-sm flex flex-col items-center justify-center bg-gray-50/20"
                    >
                      <Workflow className="w-10 h-10 mb-4 text-[#e5e5e0]" strokeWidth={1} />
                      <p>No active tasks found.</p>
                      {!isGuest && (
                        <button
                          onClick={openCreateModal}
                          className="mt-4 px-4 py-2 bg-white border border-[#e5e5e0] rounded-lg text-[#d97757] hover:border-[#d97757]/30 transition-all font-medium text-xs"
                        >
                          Add your first task
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                  serviceStatuses={serviceStatuses}
                />
              </motion.div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <TaskConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        serviceId={editingServiceId}
        onSuccess={refreshAll}
      />

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
