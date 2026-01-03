/**
 * 统一的日志工具
 *
 * 封装 console 方法，支持根据环境控制日志输出
 */
const IS_PROD = process.env.NODE_ENV === 'production';

export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (!IS_PROD) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (!IS_PROD) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
