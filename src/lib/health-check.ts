import type { ServiceHealth } from '@/types';
import { supabase } from './supabase';
import { getBeijingDateString } from './utils';
import { ServiceFactory } from '@/services/ServiceFactory';
import { DynamicService } from '@/services/DynamicService';
import { createClient } from '@supabase/supabase-js';

const HEARTBEAT_STALE_HOURS = 36;

/**
 * 检查今日是否有签到记录
 */
async function checkTodayCheckin(service: string): Promise<boolean> {
  try {
    const todayStr = getBeijingDateString();
    const todayStart = new Date(`${todayStr}T00:00:00.000+08:00`).toISOString();

    const { count, error } = await supabase
      .from('keep_alive_logs')
      .select('*', { count: 'exact', head: true })
      .eq('service', service.toLowerCase())
      .eq('status', 'success')
      .gte('timestamp', todayStart);

    if (error) {
      return false; // 查询失败时默认为未签到
    }

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * 检查最近连续失败次数（直到最近一次成功为止）
 */
async function getConsecutiveFailures(service: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('keep_alive_logs')
      .select('status')
      .eq('service', service.toLowerCase())
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error || !data) {
      return 0;
    }

    let failures = 0;
    for (const entry of data) {
      if (entry.status === 'success') break;
      if (entry.status === 'failure') failures++;
    }

    return failures;
  } catch {
    return 0;
  }
}

function isHeartbeatLagging(timestamp?: string): boolean {
  if (!timestamp) return true;

  const heartbeatAt = new Date(timestamp).getTime();
  if (Number.isNaN(heartbeatAt)) return true;

  const thresholdMs = HEARTBEAT_STALE_HOURS * 60 * 60 * 1000;
  return Date.now() - heartbeatAt > thresholdMs;
}

/**
 * 读取远程 Supabase keep_alive 心跳时间
 */
async function getRemoteHeartbeat(service: DynamicService): Promise<{
  remoteHeartbeatAt?: string;
  remoteHeartbeatLagging?: boolean;
}> {
  const { config } = service.fullConfig;
  const isRemote = !!(config.supabase_url && config.supabase_key);

  if (!isRemote || service.type !== 'supabase_internal') {
    return {};
  }

  try {
    const remoteClient = createClient(config.supabase_url!, config.supabase_key!);
    const targetTable = config.table_name || 'keep_alive';
    const { data, error } = await remoteClient
      .from(targetTable)
      .select('last_active_at')
      .eq('service', service.name.toLowerCase())
      .single();

    if (error || !data?.last_active_at) {
      return { remoteHeartbeatLagging: true };
    }

    return {
      remoteHeartbeatAt: data.last_active_at,
      remoteHeartbeatLagging: isHeartbeatLagging(data.last_active_at),
    };
  } catch {
    return { remoteHeartbeatLagging: true };
  }
}

/**
 * 统一的服务健康检查函数 (Generic)
 */
export async function checkServiceHealth(serviceId: string): Promise<ServiceHealth> {
  const service = await ServiceFactory.getService(serviceId);
  if (!service) {
    return {
      status: 'misconfigured',
      tableExists: true,
      stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      message: `Service config for "${serviceId}" not found`,
      todayCheckedIn: false,
    };
  }

  const result = await service.getStats();

  if (!result.ok) {
    return {
      status: 'misconfigured',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      message: result.error || 'Database setup required',
      todayCheckedIn: false,
    };
  }

  const { enabled, tableExists, ...stats } = result.data;
  const [todayCheckedIn, consecutiveFailures] = await Promise.all([
    checkTodayCheckin(serviceId),
    getConsecutiveFailures(serviceId),
  ]);

  // 如果是 DynamicService，获取其完整配置以供前端瞬间展示
  let config = undefined;
  let rules = undefined;
  let remoteHeartbeatAt = undefined;
  let remoteHeartbeatLagging = undefined;

  if (service instanceof DynamicService) {
    config = service.fullConfig?.config;
    rules = service.fullConfig?.rules;
    ({ remoteHeartbeatAt, remoteHeartbeatLagging } = await getRemoteHeartbeat(service));
  }

  const health: ServiceHealth = {
    status: 'operational',
    tableExists,
    stats,
    enabled,
    notification_level: service.notifyLevel,
    todayCheckedIn,
    name: service.displayName,
    type: service.type,
    description: service.description,
    category: service.category,
    ...(consecutiveFailures > 0 ? { consecutiveFailures } : {}),
    ...(remoteHeartbeatAt ? { remoteHeartbeatAt } : {}),
    ...(remoteHeartbeatLagging !== undefined ? { remoteHeartbeatLagging } : {}),
    ...(config ? { config } : {}),
    ...(rules ? { rules } : {}),
  };

  return health;
}

/**
 * 检查所有可用服务的健康状态
 */
export async function checkAllServicesHealth(): Promise<Record<string, ServiceHealth>> {
  const { data: configs, error } = await supabase.from('service_configs').select('service');

  if (error || !configs) return {};

  const healthResults: Record<string, ServiceHealth> = {};

  await Promise.all(
    configs.map(async cfg => {
      healthResults[cfg.service] = await checkServiceHealth(cfg.service);
    })
  );

  return healthResults;
}

/**
 * 统一的 Supabase 健康检查函数 (保持兼容性)
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  return checkServiceHealth('supabase');
}

/**
 * 统一的 GLaDOS 健康检查函数 (保持兼容性)
 */
export async function checkGladosHealth(): Promise<ServiceHealth> {
  return checkServiceHealth('glados');
}
