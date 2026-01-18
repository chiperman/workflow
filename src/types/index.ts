/**
 * 统一的类型定义
 *
 * 集中管理所有共享类型，避免重复定义和不一致问题
 */

/**
 * 统一的结果类型 (Result Pattern)
 *
 * 用于表示可能成功或失败的操作结果。
 * - 成功时: { ok: true, data: T }
 * - 失败时: { ok: false, error: E }
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return { ok: false, error: 'Division by zero' };
 *   return { ok: true, data: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log(result.data); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E };

/**
 * 服务统计数据
 */
export interface ServiceStats {
  auto_count: number;
  manual_count: number;
  failure_count: number;
}

/**
 * 服务健康状态
 */
export type ServiceStatus = 'operational' | 'misconfigured' | 'outage' | 'unknown';

/**
 * 服务健康信息
 */
export interface ServiceHealth {
  status: ServiceStatus;
  tableExists?: boolean;
  stats: ServiceStats;
  message?: string;
  enabled?: boolean;
}

/**
 * 系统整体状态
 */
export type SystemStatus = 'Operational' | 'Degraded' | 'Checking';

/**
 * 健康检查 API 响应
 */
export interface HealthCheckResponse {
  status: SystemStatus;
  services: {
    supabase: ServiceHealth;
    glados: ServiceHealth;
  };
}

/**
 * Keep-alive 函数返回类型
 */
export interface KeepAliveResult {
  success: boolean;
  action?: 'updated' | 'created';
  message: string;
  duration: number;
  data?: ServiceStats;
  error?: string;
  /** 设为 true 时跳过日志记录（如 GLaDOS 重复签到场景） */
  skipLog?: boolean;
}

/**
 * Stats 查询结果
 */
export interface StatsQueryResult {
  success: boolean;
  data?: ServiceStats;
  tableExists?: boolean;
  enabled?: boolean;
  error?: string;
}
