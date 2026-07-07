import packageJson from '../../package.json';

/**
 * 应用版本号 (从 package.json 读取)
 */
export const APP_VERSION = `v${packageJson.version}` as const;

/**
 * Framer Motion 动画配置
 */
export const MOTION_CONFIG = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1], // Anthropic-style quint ease
  yOffset: 15,
  delay: {
    header: 0,
    description: 0.1,
    heatmap: 0.2,
    cards: 0.3,
    cardStagger: 0.08,
    footer: 0.5,
    heatmapYears: 2, // 恢复：年份选择器的延迟
  },
} as const;

/**
 * 热力图颜色配置 (Tailwind Utility Classes)
 */
export const HEATMAP_COLORS = {
  LEVEL_0: 'bg-heatmap-level-0',
  LEVEL_SUCCESS: 'bg-heatmap-level-success',
  LEVEL_FAILURE: 'bg-heatmap-level-failure',
  ACTIVE_YEAR: '#d97757',
  INACTIVE_YEAR: 'transparent',
} as const;

/**
 * 热力图功能配置
 */
export const HEATMAP_CONFIG = {
  /** 单元格动画间隔 (ms) */
  ANIMATION_INTERVAL: 5,
} as const;

/**
 * 允许公开访问的路径列表 (无需显式登录)
 */
export const PUBLIC_PATHS = ['/', '/login', '/api/health', '/api/auth', '/favicon.ico'] as const;

/**
 * 允许公开访问的路径前缀
 */
export const PUBLIC_PATH_PREFIXES = ['/_next'] as const;

/**
 * 服务端重试配置
 */
export const RETRY_CONFIG = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 基础重试延迟 (ms) */
  BASE_DELAY_MS: 1000,
  /** 指数退避乘数 */
  BACKOFF_MULTIPLIER: 2,
  /** 默认初始重试延迟 (兼容旧版引用) */
  INITIAL_DELAY: 1000,
} as const;

/**
 * 测试环境配置
 */
export const TEST_CONFIG = {
  MOCK_DELAY: 100,
  TIMEOUT_MS: 10000,
} as const;
