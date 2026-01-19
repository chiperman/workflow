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
} as const;

/**
 * 服务标识符
 */
export const SERVICES = {
  SUPABASE: 'supabase',
  GLADOS: 'glados',
} as const;

export type ServiceName = (typeof SERVICES)[keyof typeof SERVICES];

/** 有效服务名称列表，用于 API 验证 */
export const VALID_SERVICES: ServiceName[] = Object.values(SERVICES);

/**
 * 动效时序配置 - Anthropic 风格：温柔、舒缓
 * 所有元素按页面从上到下顺序依次入场
 */
export const MOTION_CONFIG = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1] as const,
  /** Y轴位移量 (px) */
  yOffset: 15,
  delay: {
    header: 0,
    description: 0.1,
    heatmap: 0.2,
    cards: 0.3,
    cardStagger: 0.1,
    get footer() {
      // cards(0.3) + stagger(0.1) * 3 + buffer(0.1) = 0.7
      return 0.7;
    },
  },
} as const;

/**
 * 热力图配置
 */
export const HEATMAP_CONFIG = {
  /** 单元格动画间隔 (ms) */
  ANIMATION_INTERVAL: 5,
} as const;
