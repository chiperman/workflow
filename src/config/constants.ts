import packageJson from '../../package.json';

/**
 * 应用版本号（从 package.json 读取）
 */
export const APP_VERSION = `v${packageJson.version}` as const;

/**
 * 应用配置常量
 *
 * 集中管理所有魔术数字和配置值
 */

/**
 * 重试配置
 */
export const RETRY_CONFIG = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 基础延迟时间（毫秒） */
  BASE_DELAY_MS: 1000,
  /** 指数退避倍数 */
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * 测试超时配置
 */
export const TEST_CONFIG = {
  /** 测试超时时间（毫秒） */
  TIMEOUT_MS: 10000,
} as const;

/**
 * 数据库配置
 */
export const DATABASE_CONFIG = {
  /** Supabase keep_alive 表的主键 ID */
  KEEP_ALIVE_ID: 1,
  /** LeanCloud 查询限制 */
  QUERY_LIMIT: 1,
} as const;
