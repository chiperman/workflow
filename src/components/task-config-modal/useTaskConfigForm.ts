'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { splitHeadersBySensitivity } from '@/lib/crypto';
import type { ServiceConfig } from '@/types';

import {
  createEditableConfig,
  createHeadersString,
  createRulesString,
  DEFAULT_CONFIG,
  DEFAULT_HEADERS_STR,
  DEFAULT_RULES_STR,
  hasAdvancedRules,
} from './config';

interface UseTaskConfigFormArgs {
  isOpen: boolean;
  serviceId?: string;
  initialConfig?: Partial<ServiceConfig>;
  onClose: () => void;
  onSuccess?: () => void;
}

export function useTaskConfigForm({
  isOpen,
  serviceId,
  initialConfig,
  onClose,
  onSuccess,
}: UseTaskConfigFormArgs) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);
  const [showBarkKey, setShowBarkKey] = useState(false);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [config, setConfig] = useState<Partial<ServiceConfig>>(DEFAULT_CONFIG);
  const [headersStr, setHeadersStr] = useState(DEFAULT_HEADERS_STR);
  const [rulesStr, setRulesStr] = useState(DEFAULT_RULES_STR);
  const [headersInvalid, setHeadersInvalid] = useState(false);
  const [rulesInvalid, setRulesInvalid] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setShowBarkKey(false);
    setShowSupabaseKey(false);
    setHeadersInvalid(false);
    setRulesInvalid(false);

    if (!serviceId) {
      setConfig(DEFAULT_CONFIG);
      setHeadersStr(DEFAULT_HEADERS_STR);
      setRulesStr(DEFAULT_RULES_STR);
      setShowAdvancedRules(false);
      return;
    }

    if (initialConfig) {
      const finalConfig = createEditableConfig(initialConfig);
      setConfig(finalConfig);
      setHeadersStr(createHeadersString(finalConfig));
      setRulesStr(createRulesString(finalConfig));
      setShowAdvancedRules(hasAdvancedRules(finalConfig));
    }
  }, [isOpen, serviceId, initialConfig]);

  const updateHeaders = (value: string) => {
    setHeadersStr(value);
    try {
      const headers = JSON.parse(value);
      const { configHeaders, secretHeaders } = splitHeadersBySensitivity(headers);
      setConfig(current => ({
        ...current,
        config: {
          ...current.config!,
          headers: configHeaders,
        },
        secret_config: {
          ...current.secret_config!,
          headers: secretHeaders,
        },
      }));
      setHeadersInvalid(false);
    } catch {
      setHeadersInvalid(true);
    }
  };

  const updateRules = (value: string) => {
    setRulesStr(value);
    try {
      const successRules = JSON.parse(value);
      setConfig(current => ({ ...current, rules: { ...current.rules!, success: successRules } }));
      setRulesInvalid(false);
    } catch {
      setRulesInvalid(true);
    }
  };

  const addUrl = () => {
    setConfig(current => {
      const urls = [...(current.config?.urls || ['']), ''];
      return { ...current, config: { ...current.config!, urls } };
    });
  };

  const removeUrl = (index: number) => {
    setConfig(current => {
      const urls = [...(current.config?.urls || [''])];
      if (urls.length <= 1) return current;
      urls.splice(index, 1);
      return { ...current, config: { ...current.config!, urls } };
    });
  };

  const updateUrl = (index: number, value: string) => {
    setConfig(current => {
      const urls = [...(current.config?.urls || [''])];
      urls[index] = value;
      return { ...current, config: { ...current.config!, urls } };
    });
  };

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

          setConfig(current => ({
            ...current,
            rules: { ...current.rules!, success: suggestedRules },
          }));
          setRulesStr(JSON.stringify(suggestedRules, null, 2));
        }
      } else {
        toast.error('Test failed: ' + (resData.error || resData.message));
      }
    } catch {
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

    if (headersInvalid) {
      toast.error('Invalid JSON in headers, please fix before saving');
      return;
    }

    if (showAdvancedRules && rulesInvalid) {
      toast.error('Invalid JSON in rule definition, please fix before saving');
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

  return {
    config,
    setConfig,
    headersStr,
    rulesStr,
    headersInvalid,
    rulesInvalid,
    isSaving,
    isTesting,
    showAdvancedRules,
    showBarkKey,
    showSupabaseKey,
    setShowAdvancedRules,
    setShowBarkKey,
    setShowSupabaseKey,
    updateHeaders,
    updateRules,
    addUrl,
    removeUrl,
    updateUrl,
    handleTestAndDetect,
    handleSave,
  };
}
