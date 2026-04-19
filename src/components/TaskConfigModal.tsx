'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ServiceConfig } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  X,
  Save,
  Plus,
  Trash2,
  Globe,
  Settings,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

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
  config: {
    urls: [''],
    method: 'POST',
    headers: {},
    cookie: '',
    body: '',
    success_message_template: '',
    repeat_message_template: '',
  },
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
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [showBarkKey, setShowBarkKey] = useState(false);

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
        config: initialConfig.config || {
          urls: [''],
          method: 'POST',
          headers: {},
          body: '',
          success_message_template: '',
          repeat_message_template: '',
        },
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
    if (config.type === 'http' && !config.config?.urls?.[0]) {
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Save error details:', resData);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Save failed:', error);
      }
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed -inset-20 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            className="bg-white/95 backdrop-blur-xl w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-[#e5e5e0] flex flex-col relative z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f0f0ed] flex justify-between items-center bg-[#fdfcf8]/50">
              <div>
                <h2 className="text-lg font-semibold text-foreground font-serif">
                  {serviceId ? 'Edit Protocol Task' : 'New Maintenance Protocol'}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {' '}
                  Configure execution and validation rules{' '}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-text-secondary hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Basic Info */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" aria-hidden="true" /> Basic Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="service-id"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Service ID (unique)
                    </label>
                    <input
                      id="service-id"
                      disabled={!!serviceId}
                      value={config.service || ''}
                      onChange={e =>
                        setConfig({ ...config, service: e.target.value.toLowerCase() })
                      }
                      placeholder="e.g. glados"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="display-name"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Display Name
                    </label>
                    <input
                      id="display-name"
                      value={config.name || ''}
                      onChange={e => setConfig({ ...config, name: e.target.value })}
                      placeholder="e.g. GLaDOS Checkin"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="category"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Category
                    </label>
                    <input
                      id="category"
                      value={config.category || ''}
                      onChange={e => setConfig({ ...config, category: e.target.value })}
                      placeholder="e.g. Access Protocol"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="notification-level"
                        className="text-[11px] font-medium text-text-tertiary"
                      >
                        Notification Level
                      </label>
                      <select
                        id="notification-level"
                        value={config.notification_level}
                        onChange={e =>
                          setConfig({
                            ...config,
                            notification_level: e.target.value as
                              | 'always'
                              | 'failure-only'
                              | 'none',
                          })
                        }
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                      >
                        <option value="always">Always Notify</option>
                        <option value="failure-only">On Failure Only</option>
                        <option value="none">Disabled</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="bark-key"
                        className="text-[11px] font-medium text-text-tertiary"
                      >
                        Bark Key (Optional)
                      </label>
                      <div className="relative">
                        <input
                          id="bark-key"
                          type={showBarkKey ? 'text' : 'password'}
                          value={config.config?.notification_key || ''}
                          onChange={e =>
                            setConfig({
                              ...config,
                              config: { ...config.config!, notification_key: e.target.value },
                            })
                          }
                          placeholder="individual device key"
                          className="w-full pl-3 pr-10 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowBarkKey(!showBarkKey)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
                          aria-label={showBarkKey ? 'Hide bark key' : 'Show bark key'}
                        >
                          {showBarkKey ? (
                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="description"
                    className="text-[11px] font-medium text-text-tertiary"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    value={config.description || ''}
                    onChange={e => setConfig({ ...config, description: e.target.value })}
                    placeholder="Brief description of what this task does..."
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="task-type" className="text-[11px] font-medium text-text-tertiary">
                    Task Type
                  </label>
                  <select
                    id="task-type"
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
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" /> HTTP Settings
                  </h3>
                  <div className="space-y-3">
                    <label className="text-[11px] font-medium text-text-tertiary">
                      Target URL(s)
                    </label>
                    {(config.config?.urls || ['']).map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          value={url}
                          onChange={e => updateUrl(index, e.target.value)}
                          placeholder="https://api.example.com/checkin"
                          aria-label={`Target URL ${index + 1}`}
                          className="flex-1 px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUrl(index)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          aria-label={`Remove URL ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={addUrl}
                      className="px-0 h-auto text-accent-primary hover:text-accent-primary/80"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add another node
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="http-method"
                        className="text-[11px] font-medium text-text-tertiary"
                      >
                        Method
                      </label>
                      <select
                        id="http-method"
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
                      <label
                        htmlFor="cookie"
                        className="text-[11px] font-medium text-text-tertiary"
                      >
                        Cookie (Direct Input)
                      </label>
                      <input
                        id="cookie"
                        value={config.config?.cookie || ''}
                        onChange={e =>
                          setConfig({
                            ...config,
                            config: { ...config.config!, cookie: e.target.value },
                          })
                        }
                        placeholder="paste your cookie string here"
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="headers" className="text-[11px] font-medium text-text-tertiary">
                      Headers (JSON)
                    </label>
                    <input
                      id="headers"
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
                  <div className="space-y-1.5">
                    <label
                      htmlFor="success-message-template"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Success Message Template
                    </label>
                    <input
                      id="success-message-template"
                      value={config.config?.success_message_template || ''}
                      onChange={e =>
                        setConfig({
                          ...config,
                          config: {
                            ...config.config!,
                            success_message_template: e.target.value,
                          },
                        })
                      }
                      placeholder="例如：{{service}} 签到成功，获得 {{points}} 积分 [{{time}}]"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm"
                    />
                    <p className="text-[11px] text-text-secondary">
                      可用变量：{'{{service}}'}、{'{{time}}'}、{'{{trigger}}'} 以及返回 JSON
                      路径，如
                      {' {{points}} '}或 {'{{data.reward}}'}。
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="repeat-message-template"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Repeat Check-in Template
                    </label>
                    <input
                      id="repeat-message-template"
                      value={config.config?.repeat_message_template || ''}
                      onChange={e =>
                        setConfig({
                          ...config,
                          config: {
                            ...config.config!,
                            repeat_message_template: e.target.value,
                          },
                        })
                      }
                      placeholder="例如：{{service}} 今日已签到，未获得新积分"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm"
                    />
                    <p className="text-[11px] text-text-secondary">
                      当接口成功但不增加计数时使用，适合“今日已签到”这类重复签到提示。
                    </p>
                  </div>
                </section>
              )}

              {config.type === 'supabase_internal' && (
                <section className="space-y-4 pt-4 border-t border-[#f0f0ed]">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" /> Remote Supabase Settings
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Leave blank to use the current project credentials.
                  </p>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="supabase-url"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Supabase URL
                    </label>
                    <input
                      id="supabase-url"
                      value={config.config?.supabase_url || ''}
                      onChange={e =>
                        setConfig({
                          ...config,
                          config: { ...config.config!, supabase_url: e.target.value },
                        })
                      }
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="supabase-key"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Service Role Key (Private)
                    </label>
                    <div className="relative">
                      <input
                        id="supabase-key"
                        type={showSupabaseKey ? 'text' : 'password'}
                        value={config.config?.supabase_key || ''}
                        onChange={e =>
                          setConfig({
                            ...config,
                            config: { ...config.config!, supabase_key: e.target.value },
                          })
                        }
                        placeholder="your-service-role-key"
                        className="w-full pl-3 pr-10 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
                        aria-label={showSupabaseKey ? 'Hide supabase key' : 'Show supabase key'}
                      >
                        {showSupabaseKey ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="table-name"
                      className="text-[11px] font-medium text-text-tertiary"
                    >
                      Target Table (for keep-alive query)
                    </label>
                    <input
                      id="table-name"
                      value={config.config?.table_name || ''}
                      onChange={e =>
                        setConfig({
                          ...config,
                          config: { ...config.config!, table_name: e.target.value },
                        })
                      }
                      placeholder="keep_alive (default)"
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e5e5e0] rounded-lg text-sm focus:outline-none focus:border-[#d97757]/50"
                    />
                  </div>
                </section>
              )}

              {/* Rules Section */}
              <section className="space-y-4 pt-4 border-t border-[#f0f0ed]">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Validation Rules
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isTesting}
                    onClick={handleTestAndDetect}
                    className="text-[10px] h-8 bg-background text-accent-primary hover:text-accent-primary border-border-custom hover:border-accent-primary/30"
                    aria-label="Test and detect rules"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <Globe className="w-3 h-3" aria-hidden="true" />
                    )}
                    Test & Detect Rules
                  </Button>
                </div>

                <div className="bg-[#f9f9f9] border border-[#f0f0ed] p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label
                        htmlFor="smart-detection"
                        className="text-sm font-medium text-foreground"
                      >
                        Smart Detection
                      </label>
                      <p className="text-[11px] text-text-secondary">
                        Automatically detect success keywords (Success, OK, 0)
                      </p>
                    </div>
                    <input
                      id="smart-detection"
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
                      className="w-4 h-4 rounded text-accent-primary focus:ring-accent-primary"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAdvancedRules(!showAdvancedRules)}
                      className="px-0 h-auto text-[10px] text-text-secondary hover:text-foreground underline underline-offset-4"
                      aria-expanded={showAdvancedRules}
                    >
                      {showAdvancedRules ? 'Hide Precise Rules' : 'Show Precise Rules (JSON)'}
                    </Button>
                  </div>

                  {showAdvancedRules && (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label
                        htmlFor="json-rules"
                        className="text-[11px] font-medium text-text-tertiary"
                      >
                        JSON Rule Definition
                      </label>
                      <textarea
                        id="json-rules"
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
            <div className="p-6 border-t border-[#f0f0ed] bg-[#fdfcf8]/50">
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-6 h-11"
                  aria-label={isSaving ? 'Saving configuration' : 'Save configuration'}
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" aria-hidden="true" /> Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
