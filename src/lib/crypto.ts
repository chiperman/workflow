import crypto from 'crypto';

/**
 * 敏感字段名列表
 */
const SENSITIVE_KEYS = ['cookie', 'token', 'password', 'supabase_key', 'api_key', 'secret'];

/**
 * 获取加密密钥 (从 APP_KEY 派生 32 字节密钥)
 */
function getEncryptionKey(): Buffer {
  const appKey = process.env.APP_KEY || 'default-secret-key-at-least-32-chars-long';
  // 使用 SHA-256 确保密钥始终为 32 字节
  return crypto.createHash('sha256').update(appKey).digest();
}

/**
 * 加密字符串
 * 格式: enc:iv.ciphertext.tag
 */
export function encrypt(text: string): string {
  if (!text || text.startsWith('enc:')) return text;

  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return `enc:${iv.toString('hex')}.${encrypted}.${tag}`;
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
 * 通用递归 JSON 对象类型
 */
type ConfigObject = Record<string, unknown> | unknown[];

/**
 * 递归加密对象中的敏感字段
 */
export function encryptConfig(obj: ConfigObject): ConfigObject {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string, unknown>;

  for (const key in newObj) {
    const value = newObj[key];
    if (value && typeof value === 'object') {
      newObj[key] = encryptConfig(value as ConfigObject);
    } else if (typeof value === 'string' && SENSITIVE_KEYS.includes(key.toLowerCase())) {
      newObj[key] = encrypt(value);
    }
  }

  return newObj as ConfigObject;
}

/**
 * 递归解密对象中的敏感字段
 */
export function decryptConfig(obj: ConfigObject): ConfigObject {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string, unknown>;

  for (const key in newObj) {
    const value = newObj[key];
    if (value && typeof value === 'object') {
      newObj[key] = decryptConfig(value as ConfigObject);
    } else if (typeof value === 'string' && value.startsWith('enc:')) {
      newObj[key] = decrypt(value);
    }
  }

  return newObj as ConfigObject;
}

/**
 * 递归脱敏对象中的加密字段 (用于 UI 展示)
 */
export function maskConfig(obj: ConfigObject): ConfigObject {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string, unknown>;

  for (const key in newObj) {
    const value = newObj[key];
    if (value && typeof value === 'object') {
      newObj[key] = maskConfig(value as ConfigObject);
    } else if (
      typeof value === 'string' &&
      (value.startsWith('enc:') || SENSITIVE_KEYS.includes(key.toLowerCase()))
    ) {
      newObj[key] = '********';
    }
  }

  return newObj as ConfigObject;
}
