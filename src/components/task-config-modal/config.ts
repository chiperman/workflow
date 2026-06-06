import type { ServiceConfig } from '@/types';
import { normalizeConfigSegments } from '@/lib/crypto';

export const DEFAULT_HEADERS_STR = '{}';
export const DEFAULT_RULES_STR = '{\n  "status": 200\n}';

const DEFAULT_RUNTIME_CONFIG = {
  urls: [''],
  method: 'POST' as const,
  headers: {},
  body: '',
  success_message_template: '',
  repeat_message_template: '',
};

const DEFAULT_SECRET_CONFIG = {
  cookie: '',
  supabase_key: '',
  notification_key: '',
};

export const DEFAULT_CONFIG: Partial<ServiceConfig> = {
  service: '',
  name: '',
  type: 'http',
  enabled: true,
  notification_level: 'failure-only',
  config: DEFAULT_RUNTIME_CONFIG,
  secret_config: DEFAULT_SECRET_CONFIG,
  rules: { success: { status: 200 } },
};

export function createEditableConfig(initialConfig: Partial<ServiceConfig>) {
  const normalized = normalizeConfigSegments(initialConfig.config, initialConfig.secret_config);

  return {
    ...initialConfig,
    config: normalized.config || DEFAULT_RUNTIME_CONFIG,
    secret_config: normalized.secret_config || DEFAULT_SECRET_CONFIG,
    rules: initialConfig.rules || { success: { status: 200, smart_matching: true } },
  };
}

export function createHeadersString(config: Partial<ServiceConfig>) {
  return JSON.stringify(
    {
      ...(config.config?.headers || {}),
      ...(config.secret_config?.headers || {}),
    },
    null,
    2
  );
}

export function createRulesString(config: Partial<ServiceConfig>) {
  return JSON.stringify(config.rules?.success || {}, null, 2);
}

export function hasAdvancedRules(config: Partial<ServiceConfig>) {
  return Boolean(config.rules?.success?.json && config.rules.success.json.length > 0);
}
