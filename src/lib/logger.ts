/**
 * 统一的日志工具
 *
 * 封装 console 方法，支持根据环境控制日志输出
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const CURRENT_LEVEL: number = (() => {
  const envLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'info';
  return LOG_LEVELS[envLevel] ?? (process.env.NODE_ENV === 'production' ? 1 : 0);
})();

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= CURRENT_LEVEL;
};

export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
