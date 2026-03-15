'use client';

import { useState, useEffect } from 'react';
import type { ServiceConfig } from '@/types';
import { toast } from 'sonner';
import { X, Save, Plus, Trash2, Globe, Settings, CheckCircle, RefreshCw } from 'lucide-react';

interface TaskConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: string; // If provided, we're editing. If not, we're creating.
  initialConfig?: Partial<ServiceConfig>; // 直接传入已有配置，消除二次获取
  onSuccess?: () => void;
}

const DEFAULT_CONFIG: Partial<ServiceConfig> = {
  service: '',
  name: '',
  type: 'http',
  enabled: true,
  notification_level: 'failure-only',
  config: { urls: [''], method: 'POST', headers: {}, body: '' },
  rules: { success: { status: 200 } },
};

export function TaskConfigModal({
  isOpen,
  onClose,
  serviceId,
  initialConfig,
  onSuccess,
}: TaskConfigModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);

  const [config, setConfig] = useState<Partial<ServiceConfig>>(DEFAULT_CONFIG);
  // 局部状态处理 JSON 字符串，避免直接绑定 JSON.stringify 导致的编辑卡顿
  const [headersStr, setHeadersStr] = useState('{}');
  const [rulesStr, setRulesStr] = useState('{\n  "status": 200\n}');

  useEffect(() => {
    if (!isOpen) return;

    if (!serviceId) {
      setConfig(DEFAULT_CONFIG);
      setHeadersStr('{}');
      setRulesStr('{\n  "status": 200\n}');
      return;
    }

    // 如果传入了 initialConfig，直接同步到本地状态，不再调用 API
    if (initialConfig) {
      const finalConfig = {
        ...initialConfig,
        config: initialConfig.config || { urls: [''], method: 'POST', headers: {}, body: '' },
        rules: initialConfig.rules || { success: { status: 200, smart_matching: true } },
      };
      setConfig(finalConfig);
      setHeadersStr(JSON.stringify(finalConfig.config?.headers || {}, null, 2));
      setRulesStr(JSON.stringify(finalConfig.rules?.success || {}, null, 2));

      // 如果已经有复杂的 json 规则，自动显示高级设置
      if (finalConfig.rules?.success?.json && finalConfig.rules.success.json.length > 0) {
        setShowAdvancedRules(true);
      }
    }
  }, [isOpen, serviceId, initialConfig]);

  /**
   * 自动探测规则逻辑
   */
  const handleTestAndDetect = async () => {
    if (!config.config?.urls?.[0]) {
      toast.error('Please enter a target URL first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/tasks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const resData = await response.json();
      if (resData.success) {
        toast.success('Test successful! Success pattern detected.');

        // 智能建议：如果返回的数据里有 code: 0，自动生成 JSON 规则
        if (resData.data && typeof resData.data === 'object') {
          const data = resData.data;
          let suggestedRules = { ...config.rules?.success, status: 200, smart_matching: true };

          if (data.code === 0 || data.code === 200) {
            suggestedRules = {
              ...suggestedRules,
              // @ts-expect-error JSON rule types
              json: [{ path: 'code', operator: 'eq', value: data.code }],
            };
            setShowAdvancedRules(true);
            toast.info('Auto-generated precise rule: code == ' + data.code);
          }

          setConfig({ ...config, rules: { ...config.rules!, success: suggestedRules } });
          setRulesStr(JSON.stringify(suggestedRules, null, 2));
        }
      } else {
        toast.error('Test failed: ' + (resData.error || resData.message));
      }
    } catch (_error) {
      toast.error('Network error during test');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!config.service) {
      toast.error('Service ID is required');
      return;
    }

    setIsSaving(true);
    try {
      const method = serviceId ? 'PUT' : 'POST';
      const response = await fetch('/api/service-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const resData = await response.json();
      if (resData.success) {
        toast.success(serviceId ? 'Task updated' : 'Task created');
        onSuccess?.();
        onClose();
      } else {
        // 优先显示详细错误信息 (resData.error)，否则退而求其次显示 resData.message
        const errorMessage = resData.error || resData.message || 'Failed to save configuration';
        toast.error(errorMessage);
        console.error('Save error details:', resData);
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Network error. Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const addUrl = () => {
    const urls = [...(config.config?.urls || [''])];
    urls.push('');
    setConfig({ ...config, config: { ...config.config!, urls } });
  };

  const removeUrl = (index: number) => {
    const urls = [...(config.config?.urls || [''])];
    if (urls.length <= 1) return;
    urls.splice(index, 1);
    setConfig({ ...config, config: { ...config.config!, urls } });
  };

  const updateUrl = (index: number, value: string) => {
    const urls = [...(config.config?.urls || [''])];
    urls[index] = value;
    setConfig({ ...config, config: { ...config.config!, urls } });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-[#e5e5e0] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f0f0ed] flex justify-between items-center bg-[#fdfcf8]">
          <div>
            <h2 className="text-lg font-semibold text-[#191919] font-serif">
              {serviceId ? 'Edit Protocol Task' : 'New Maintenance Protocol'}
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              {' '}
              Configure execution and validation rules{' '}
            </p>
          </div>
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
                  onChange={e => setConfig({ ...config, service: e.target.value.toLowerCase() })}
                  placeholder="e.g. glados"
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#555555]">Display Name</label>
                <input
                  value={config.name || ''}
                  onChange={e => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g. GLaDOS Checkin"
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
          </section>

          {config.type === 'http' && (
            <section className="space-y-4 pt-4 border-t border-[#f0f0ed]">
              <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> HTTP Settings
              </h3>
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-[#555555]">Target URL(s)</label>
                {(config.config?.urls || ['']).map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={url}
                      onChange={e => updateUrl(index, e.target.value)}
                      placeholder="https://api.example.com/checkin"
                      className="flex-1 px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                    />
                    <button
                      onClick={() => removeUrl(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addUrl}
                  className="text-xs flex items-center gap-1 text-[#d97757] hover:underline font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add another node
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[#555555]">Method</label>
                  <select
                    value={config.config?.method}
                    onChange={e =>
                      setConfig({
                        ...config,
                        config: {
                          ...config.config!,
                          method: e.target.value as 'GET' | 'POST' | 'PUT',
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-medium text-[#555555]">Headers (JSON)</label>
                  <input
                    value={headersStr}
                    onChange={e => {
                      setHeadersStr(e.target.value);
                      try {
                        const h = JSON.parse(e.target.value);
                        setConfig({ ...config, config: { ...config.config!, headers: h } });
                      } catch (_err) {
                        // Silently handle invalid JSON while typing
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Rules Section */}
          <section className="space-y-4 pt-4 border-t border-[#f0f0ed]">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-[#888888] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> Validation Rules
              </h3>
              <button
                disabled={isTesting}
                onClick={handleTestAndDetect}
                className="text-[10px] flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fdfcf8] border border-[#e5e5e0] rounded-md text-[#d97757] hover:border-[#d97757]/30 transition-all font-medium"
              >
                {isTesting ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Globe className="w-3 h-3" />
                )}
                Test & Detect Rules
              </button>
            </div>

            <div className="bg-[#f9f9f9] border border-[#f0f0ed] p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-[#191919]">Smart Detection</label>
                  <p className="text-[11px] text-[#888888]">
                    Automatically detect success keywords (Success, OK, 0)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.rules?.success?.smart_matching ?? true}
                  onChange={e => {
                    const updated = {
                      ...config.rules?.success,
                      smart_matching: e.target.checked,
                    };
                    setConfig({ ...config, rules: { ...config.rules!, success: updated } });
                    setRulesStr(JSON.stringify(updated, null, 2));
                  }}
                  className="w-4 h-4 rounded text-[#d97757] focus:ring-[#d97757]"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowAdvancedRules(!showAdvancedRules)}
                  className="text-[10px] text-[#888888] hover:text-[#191919] underline underline-offset-4"
                >
                  {showAdvancedRules ? 'Hide Precise Rules' : 'Show Precise Rules (JSON)'}
                </button>
              </div>

              {showAdvancedRules && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-medium text-[#555555]">
                    JSON Rule Definition
                  </label>
                  <textarea
                    rows={10}
                    value={rulesStr}
                    onChange={e => {
                      setRulesStr(e.target.value);
                      try {
                        const s = JSON.parse(e.target.value);
                        setConfig({ ...config, rules: { ...config.rules!, success: s } });
                      } catch (_err) {
                        // Silently handle invalid JSON while typing
                      }
                    }}
                    className="w-full px-3 py-3 bg-white border border-[#e5e5e0] rounded-lg text-sm font-mono focus:outline-none focus:border-[#d97757]/50 leading-relaxed shadow-inner"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f0f0ed] bg-[#fdfcf8]">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="text-sm font-medium text-[#666666] hover:text-[#191919] px-4"
            >
              Cancel
            </button>
            <button
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#191919] text-[#fdfcf8] rounded-lg text-sm font-medium hover:bg-[#333333] transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
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
