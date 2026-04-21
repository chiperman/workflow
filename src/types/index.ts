/**
 * 统一的类型定义
 *
 * 集中管理所有共享类型，避免重复定义和不一致问题
 */

/**
 * 统一的结果类型 (Result Pattern)
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
  /** 通知级别 */
  notification_level?: NotificationLevel;
  /** 今日是否已有签到记录 */
  todayCheckedIn?: boolean;
  /** 任务元数据 */
  name?: string;
  type?: string;
  description?: string;
  category?: string;
  /** 远程 Supabase 心跳更新时间 */
  remoteHeartbeatAt?: string;
  /** 远程心跳是否已落后于预期调度 */
  remoteHeartbeatLagging?: boolean;
  /** 最近连续失败次数（遇到最近一次成功即归零） */
  consecutiveFailures?: number;
  config?: TaskConfigData;
  secret_config?: SecretConfigData;
  rules?: {
    success?: ValidationRules;
    increment?: ValidationRules;
  };
}

/**
 * 系统整体状态
 */
export type SystemStatus = 'Operational' | 'Degraded' | 'Checking';

/**
 * 服务通知级别
 */
export type NotificationLevel = 'always' | 'failure-only' | 'none';

/**
 * 校验规则操作符
 */
export type RuleOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains';

/**
 * 校验规则条目
 */
export interface RuleEntry {
  path: string;
  operator: RuleOperator;
  value: unknown;
}

/**
 * 校验规则集合
 */
export interface ValidationRules {
  status?: number;
  json?: RuleEntry[];
  /** 智能匹配模式：自动扫描返回内容中的成功关键词 */
  smart_matching?: boolean;
}

/**
 * 通用的任务配置数据 (HTTP 或 Supabase 内部项目)
 */
export interface TaskConfigData {
  // HTTP 专用
  url?: string;
  urls?: string[]; // 支持多个 URL 轮询
  method?: string;
  body?: string;
  timeout?: number;
  success_message_template?: string;
  repeat_message_template?: string;

  // Supabase 专用
  supabase_url?: string;
  table_name?: string;
}

/**
 * 敏感配置数据
 */
export interface SecretConfigData {
  headers?: Record<string, string>;
  cookie?: string;
  token?: string;
  supabase_key?: string;
  notification_key?: string;
}

/**
 * 运行时聚合后的完整配置
 */
export type RuntimeTaskConfigData = TaskConfigData & SecretConfigData;

/**
 * 数据库表：service_configs (静态配置)
 */
export interface DbServiceConfig {
  service: string;
  name: string;
  type: 'http' | 'supabase_internal';
  description?: string;
  category?: string;
  enabled: boolean;
  config: TaskConfigData;
  secret_config: SecretConfigData;
  rules: {
    success?: ValidationRules;
    increment?: ValidationRules;
  };
  notification_level: NotificationLevel;
  created_at: string;
}

/**
 * 数据库表：service_stats (动态统计)
 */
export interface DbServiceStats {
  service: string;
  last_run_at: string | null;
  manual_count: number;
  auto_count: number;
  failure_count: number;
  updated_at: string;
}

/**
 * 数据库联表查询结果 (configs JOIN stats)
 */
export interface DbServiceJoined extends DbServiceConfig {
  service_stats?: DbServiceStats | DbServiceStats[];
}

/**
 * 服务完整配置 (业务层使用的聚合对象)
 */
export interface ServiceConfig {
  service: string;
  name: string;
  description?: string;
  category?: string;
  type: 'http' | 'supabase_internal';
  config: TaskConfigData;
  secret_config: SecretConfigData;
  rules: {
    success?: ValidationRules;
    increment?: ValidationRules;
  };
  notification_level: NotificationLevel;
  enabled: boolean;
  manual_count: number;
  auto_count: number;
  failure_count: number;
  timestamp: string;
  created_at: string;
  last_run_at?: string;
}

/**
 * 标准 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * 健康检查 API 响应
 */
export interface HealthCheckResponse {
  status: SystemStatus;
  auth?: {
    type: 'cron' | 'app-key' | 'session' | 'public' | 'none';
  };
  services: Record<string, ServiceHealth>;
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
  rawResponse?: unknown;
  error?: string;
  /** 设为 true 时跳过日志记录（如 GLaDOS 重复签到场景） */
  skipLog?: boolean;
}

/**
 * 热力图 - 单日数据
 */
export interface HeatmapDay {
  date: string;
  success_count: number;
  failure_count: number;
  services: Record<string, 'success' | 'failure'>;
}

/**
 * 热力图 - API 响应数据
 */
export interface HeatmapData {
  heatmap: HeatmapDay[];
  services: { service: string; created_at: string }[];
}

/**
 * 热力图 - 年份列表响应数据
 */
export interface YearsData {
  success: boolean;
  years?: number[];
  error?: string;
}
