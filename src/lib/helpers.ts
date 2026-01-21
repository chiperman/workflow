import { logger } from '@/lib/logger';

/**
 * 返回当前北京时间的 YYYY-MM-DD 字符串（用于日志分组）
 */
export function getBeijingDateString(): string {
  const now = new Date();
  // 北京时间 UTC+8
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = beijing.getUTCFullYear();
  const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijing.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 简易日志包装，统一前缀，便于以后切换日志实现
 */
export function logInfo(message: string, meta?: Record<string, unknown>) {
  logger.info(message, meta);
}
export function logWarn(message: string, meta?: Record<string, unknown>) {
  logger.warn(message, meta);
}
export function logError(message: string, meta?: Record<string, unknown>) {
  logger.error(message, meta);
}
