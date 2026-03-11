'use client';

import { useState, useEffect } from 'react';
import type { ServiceConfig } from '@/types';
import { toast } from 'sonner';
import { X, Save, Plus, Trash2, Globe, Settings, CheckCircle } from 'lucide-react';

interface TaskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: string; // If provided, we're editing. If not, we're creating.
  onSuccess: () => void;
}

export function TaskConfigModal({ isOpen, onClose, serviceId, onSuccess }: TaskConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Partial<ServiceConfig>>({
    service: '',
    name: '',
    type: 'http',
    notification_level: 'failure-only',
    enabled: true,
    config: {
      urls: [],
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    },
    rules: {
      success: { status: 200 },
      increment: {},
    },
  });

  useEffect(() => {
    if (serviceId && isOpen) {
      fetchServiceConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, isOpen]);

  const fetchServiceConfig = async () => {
    setLoading(true);
    try {
      await fetch(`/api/tasks/${serviceId}?mode=config`); // In reality, we need an endpoint to get the config.
      // Alternatively, we use the GET /api/service-config and filter.
      const listRes = await fetch('/api/service-config');
      const listData = await listRes.json();
      if (listData.success) {
        const found = listData.data.find((s: ServiceConfig) => s.service === serviceId);
        if (found) setConfig(found);
      }
    } catch (_err) {
      toast.error('Failed to load service config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const method = serviceId ? 'PUT' : 'POST';
      const res = await fetch('/api/service-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(serviceId ? 'Task updated' : 'Task created');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Save failed');
      }
    } catch (_err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f0f0]">
          <h2 className="text-xl font-medium text-[#191919] flex items-center gap-2">
            {serviceId ? (
              <Settings className="w-5 h-5 text-[#d97757]" />
            ) : (
              <Plus className="w-5 h-5 text-[#d97757]" />
            )}
            {serviceId ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#191919] p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Basic Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">
                  Service ID (unique)
                </label>
                <input
                  disabled={!!serviceId}
                  value={config.service || ''}
                  onChange={e => setConfig({ ...config, service: e.target.value })}
                  placeholder="e.g. glados"
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Display Name</label>
                <input
                  value={config.name || ''}
                  onChange={e => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g. GLaDOS Check-in"
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Category</label>
                <input
                  value={config.category || ''}
                  onChange={e => setConfig({ ...config, category: e.target.value })}
                  placeholder="e.g. Access Protocol"
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Notification Level</label>
                <select
                  value={config.notification_level}
                  onChange={e =>
                    setConfig({
                      ...config,
                      notification_level: e.target.value as 'always' | 'failure-only' | 'none',
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                >
                  <option value="always">Always Notify</option>
                  <option value="failure-only">On Failure Only</option>
                  <option value="none">Disabled</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#555555]">Description</label>
              <textarea
                rows={2}
                value={config.description || ''}
                onChange={e => setConfig({ ...config, description: e.target.value })}
                placeholder="Brief description of what this task does..."
                className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Task Type</label>
                <select
                  value={config.type}
                  onChange={e =>
                    setConfig({ ...config, type: e.target.value as 'http' | 'supabase_internal' })
                  }
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                >
                  <option value="http">HTTP Request</option>
                  <option value="supabase_internal">Supabase Internal</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Notification Level</label>
                <select
                  value={config.notification_level}
                  onChange={e =>
                    setConfig({
                      ...config,
                      notification_level: e.target.value as 'always' | 'failure-only' | 'none',
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                >
                  <option value="always">Always Notify</option>
                  <option value="failure-only">On Failure Only</option>
                  <option value="none">Disabled</option>
                </select>
              </div>
            </div>
          </section>

          {config.type === 'http' && (
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> HTTP Settings
              </h3>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">
                  Target URL(s) (one per line)
                </label>
                <textarea
                  rows={2}
                  value={config.config?.urls?.join('\n') || ''}
                  onChange={e =>
                    setConfig({
                      ...config,
                      config: {
                        ...config.config!,
                        urls: e.target.value.split('\n').filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#d97757]/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#555555]">Method</label>
                  <select
                    value={config.config?.method || 'GET'}
                    onChange={e =>
                      setConfig({
                        ...config,
                        config: { ...config.config!, method: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-medium text-[#555555]">Headers (JSON)</label>
                  <input
                    value={JSON.stringify(config.config?.headers)}
                    onChange={e => {
                      try {
                        const h = JSON.parse(e.target.value);
                        setConfig({ ...config, config: { ...config.config!, headers: h } });
                      } catch (_err) {}
                    }}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#d97757]/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Body (String/JSON)</label>
                <textarea
                  rows={2}
                  value={config.config?.body || ''}
                  onChange={e =>
                    setConfig({
                      ...config,
                      config: { ...config.config!, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#d97757]/50"
                />
              </div>
            </section>
          )}

          <section className="space-y-4 pb-4">
            <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5" /> Validation Rules
            </h3>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#555555]">Success Rule (JSON)</label>
              <textarea
                rows={2}
                value={JSON.stringify(config.rules?.success)}
                onChange={e => {
                  try {
                    const r = JSON.parse(e.target.value);
                    setConfig({ ...config, rules: { ...config.rules!, success: r } });
                  } catch (_err) {}
                }}
                className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#d97757]/50"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f0f0f0] flex justify-between items-center bg-gray-50/50">
          <button
            disabled={
              !serviceId || loading || ['supabase', 'glados'].includes(serviceId.toLowerCase())
            }
            onClick={async () => {
              if (confirm(`Are you sure you want to delete ${config.name}?`)) {
                setLoading(true);
                try {
                  const res = await fetch(`/api/service-config?service=${serviceId}`, {
                    method: 'DELETE',
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success('Task deleted successfully');
                    onSuccess();
                    onClose();
                  } else {
                    toast.error(data.message || 'Delete failed');
                  }
                } catch (_err) {
                  toast.error('An error occurred while deleting');
                } finally {
                  setLoading(false);
                }
              }
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 text-xs font-medium disabled:opacity-0 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Task
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#555555] hover:text-[#191919] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-[#d97757] hover:bg-[#c66a4a] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-[#d97757]/20 disabled:opacity-50"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
