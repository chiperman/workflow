import crypto from 'crypto';
import type { SecretConfigData, TaskConfigData, RuntimeTaskConfigData } from '@/types';

/**
 * UI 占位符，用于保留已有 secret
 */
export const MASKED_SECRET_VALUE = '********';

const LEGACY_SECRET_KEYS = ['cookie', 'token', 'supabase_key', 'notification_key'] as const;

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-csrf-token',
]);

type ConfigValue = object;

/**
 * 获取加密密钥 (从 APP_KEY 派生 32 字节密钥)
 */
function getEncryptionKey(): Buffer {
  if (!process.env.APP_KEY) {
    throw new Error('Missing required environment variable: APP_KEY');
  }
  return crypto.createHash('sha256').update(process.env.APP_KEY).digest();
}

/**
 * 加密字符串
 * 格式: enc:iv.ciphertext.tag
 */
export function encrypt(text: string): string {
  if (!text || text.startsWith('enc:')) return text;

  try {
    const iv = crypto.randomBytes(12);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return `enc:${iv.toString('hex')}.${encrypted}.${tag}`;
  } catch (_err) {
    // APP_KEY 未配置时降级返回原文，避免加密服务阻塞整体启动
    return text;
  }
}

/**
 * 解密字符串
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith('enc:')) return encryptedText;

  try {
    const parts = encryptedText.substring(4).split('.');
    if (parts.length !== 3) return encryptedText;

    const [ivHex, encryptedHex, tagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Decryption Error]';
  }
}

/**
 * 深拷贝 JSON 兼容对象
 */
function cloneConfigValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => cloneConfigValue(item)) as T;
  }
  if (value && typeof value === 'object') {
    const cloned: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      cloned[key] = cloneConfigValue(item);
    });
    return cloned as T;
  }
  return value;
}

function isSensitiveHeaderName(name: string): boolean {
  const normalized = name.trim().toLowerCase();

  if (!normalized) return false;
  if (SENSITIVE_HEADER_NAMES.has(normalized)) return true;

  return (
    normalized.includes('token') ||
    normalized.includes('secret') ||
    normalized.includes('authorization') ||
    normalized.endsWith('-key') ||
    normalized.includes('api-key')
  );
}

function normalizeHeaderMap(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(headers as Record<string, unknown>).filter(
      ([key, value]) => key.trim() && typeof value === 'string'
    )
  ) as Record<string, string>;
}

function decryptHeaderMap(headers: unknown): Record<string, string> {
  const headerMap = normalizeHeaderMap(headers);

  return Object.fromEntries(
    Object.entries(headerMap).map(([key, value]) => [
      key,
      value.startsWith('enc:') ? decrypt(value) : value,
    ])
  ) as Record<string, string>;
}

export function splitHeadersBySensitivity(headers: unknown): {
  configHeaders: Record<string, string>;
  secretHeaders: Record<string, string>;
} {
  const headerMap = normalizeHeaderMap(headers);
  const configHeaders: Record<string, string> = {};
  const secretHeaders: Record<string, string> = {};

  Object.entries(headerMap).forEach(([key, value]) => {
    if (isSensitiveHeaderName(key)) {
      secretHeaders[key] = value;
      return;
    }
    configHeaders[key] = value;
  });

  return { configHeaders, secretHeaders };
}

/**
 * 递归加密 secret_config 中的所有字符串
 */
export function encryptSecretConfig(obj: ConfigValue): ConfigValue {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = cloneConfigValue(obj) as Record<string, unknown>;

  for (const key in newObj) {
    const value = newObj[key];
    if (value && typeof value === 'object') {
      newObj[key] = encryptSecretConfig(value as ConfigValue);
    } else if (typeof value === 'string' && value.trim()) {
      newObj[key] = encrypt(value);
    }
  }

  return newObj as ConfigValue;
}

/**
 * 递归解密 secret_config 中的所有字符串
 */
export function decryptSecretConfig(obj: ConfigValue): ConfigValue {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = cloneConfigValue(obj) as Record<string, unknown>;

  for (const key in newObj) {
    const value = newObj[key];
    if (value && typeof value === 'object') {
      newObj[key] = decryptSecretConfig(value as ConfigValue);
    } else if (typeof value === 'string' && value.startsWith('enc:')) {
      newObj[key] = decrypt(value);
    }
  }

  return newObj as ConfigValue;
}

/**
 * 递归脱敏 secret_config (用于 UI 展示)
 */
export function maskSecretConfig(obj: ConfigValue): ConfigValue {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = cloneConfigValue(obj) as Record<string, unknown>;

  for (const key in newObj) {
    const value = newObj[key];
    if (value && typeof value === 'object') {
      newObj[key] = maskSecretConfig(value as ConfigValue);
    } else if (typeof value === 'string' && value.trim()) {
      newObj[key] = MASKED_SECRET_VALUE;
    }
  }

  return newObj as ConfigValue;
}

function pruneSecretValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(item => pruneSecretValue(item)).filter(item => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const pruned: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const next = pruneSecretValue(item);
      if (next !== undefined) {
        pruned[key] = next;
      }
    });
    return Object.keys(pruned).length > 0 ? pruned : undefined;
  }
  if (typeof value === 'string') {
    return value.trim() ? value : undefined;
  }
  return value ?? undefined;
}

function mergePreservingMasked(existing: unknown, incoming: unknown): unknown {
  if (incoming === undefined) {
    return pruneSecretValue(existing);
  }
  if (typeof incoming === 'string') {
    if (incoming === MASKED_SECRET_VALUE) {
      return pruneSecretValue(existing);
    }
    return pruneSecretValue(incoming);
  }
  if (Array.isArray(incoming)) {
    const merged = incoming
      .map((item, index) =>
        mergePreservingMasked(Array.isArray(existing) ? existing[index] : undefined, item)
      )
      .filter(item => item !== undefined);
    return merged.length > 0 ? merged : undefined;
  }
  if (incoming && typeof incoming === 'object') {
    const existingObject =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};
    const merged = ((pruneSecretValue(existingObject) as Record<string, unknown> | undefined) ??
      {}) as Record<string, unknown>;
    Object.entries(incoming as Record<string, unknown>).forEach(([key, item]) => {
      const next = mergePreservingMasked(existingObject[key], item);
      if (next !== undefined) {
        merged[key] = next;
      } else {
        delete merged[key];
      }
    });
    return Object.keys(merged).length > 0 ? merged : undefined;
  }
  return pruneSecretValue(incoming);
}

function decryptLegacyConfigSecrets(config: TaskConfigData = {}): TaskConfigData {
  const nextConfig = cloneConfigValue(config) as Record<string, unknown>;

  LEGACY_SECRET_KEYS.forEach(key => {
    const value = nextConfig[key];
    if (typeof value === 'string' && value.startsWith('enc:')) {
      nextConfig[key] = decrypt(value);
    }
  });

  if (nextConfig.headers !== undefined) {
    nextConfig.headers = decryptHeaderMap(nextConfig.headers);
  }

  return nextConfig as TaskConfigData;
}

/**
 * 将历史上放在 config 内的敏感字段统一迁移到 secret_config
 */
export function normalizeConfigSegments(
  config: TaskConfigData = {},
  secretConfig: SecretConfigData = {}
): { config: TaskConfigData; secret_config: SecretConfigData } {
  const nextConfig = cloneConfigValue(config) as Record<string, unknown>;
  const nextSecretConfig = cloneConfigValue(secretConfig) as Record<string, unknown>;

  const mergedHeaders = {
    ...normalizeHeaderMap(nextConfig.headers),
    ...normalizeHeaderMap(nextSecretConfig.headers),
  };
  const { configHeaders, secretHeaders } = splitHeadersBySensitivity(mergedHeaders);

  if (Object.keys(configHeaders).length > 0) {
    nextConfig.headers = configHeaders;
  } else {
    delete nextConfig.headers;
  }

  if (Object.keys(secretHeaders).length > 0) {
    nextSecretConfig.headers = secretHeaders;
  } else {
    delete nextSecretConfig.headers;
  }

  LEGACY_SECRET_KEYS.forEach(key => {
    if (nextConfig[key] !== undefined && nextSecretConfig[key] === undefined) {
      nextSecretConfig[key] = nextConfig[key];
    }
    delete nextConfig[key];
  });

  return {
    config: nextConfig as TaskConfigData,
    secret_config: (pruneSecretValue(nextSecretConfig) ?? {}) as SecretConfigData,
  };
}

/**
 * 将数据库中读取出的旧配置归一化为当前结构，并解开历史上遗留在 config 内的 secret
 */
export function normalizeStoredConfigSegments(
  config: TaskConfigData = {},
  secretConfig: SecretConfigData = {}
): { config: TaskConfigData; secret_config: SecretConfigData } {
  return normalizeConfigSegments(
    decryptLegacyConfigSecrets(config),
    decryptSecretConfig(secretConfig) as SecretConfigData
  );
}

/**
 * 合并普通配置与解密后的敏感配置，供运行时使用
 */
export function mergeConfigSegments(
  config: TaskConfigData = {},
  secretConfig: SecretConfigData = {}
): RuntimeTaskConfigData {
  const normalized = normalizeStoredConfigSegments(config, secretConfig);
  const headers = {
    ...(normalized.config.headers || {}),
    ...(normalized.secret_config.headers || {}),
  };

  return {
    ...normalized.config,
    ...normalized.secret_config,
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  };
}

/**
 * 合并 UI 回传的 secret_config，保留未改动的掩码值
 */
export function mergeSecretConfig(
  existing: SecretConfigData = {},
  incoming?: SecretConfigData
): SecretConfigData {
  return (mergePreservingMasked(existing, incoming) ?? {}) as SecretConfigData;
}

/**
 * 计算 PUT 更新后的最终配置分段，兼容旧版 config 结构和部分 secret_config 更新
 */
export function resolveUpdatedConfigSegments(params: {
  existingConfig?: TaskConfigData;
  existingSecretConfig?: SecretConfigData;
  incomingConfig?: TaskConfigData;
  incomingSecretConfig?: SecretConfigData;
}): { config: TaskConfigData; secret_config: SecretConfigData } {
  const existing = normalizeStoredConfigSegments(
    params.existingConfig || {},
    params.existingSecretConfig || {}
  );
  const incoming = normalizeConfigSegments(
    params.incomingConfig || {},
    params.incomingSecretConfig || {}
  );

  return {
    config: params.incomingConfig !== undefined ? incoming.config : existing.config,
    secret_config: mergeSecretConfig(existing.secret_config, incoming.secret_config),
  };
}
