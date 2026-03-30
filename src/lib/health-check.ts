import type { ServiceHealth } from '@/types';
import { supabase } from './supabase';
import { getBeijingDateString } from './utils';
import { ServiceFactory } from '@/services/ServiceFactory';
import { DynamicService } from '@/services/DynamicService';

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
  const todayCheckedIn = await checkTodayCheckin(serviceId);

  // 如果是 DynamicService，获取其完整配置以供前端瞬间展示
  let config = undefined;
  let rules = undefined;

  if (service instanceof DynamicService) {
    config = service.fullConfig?.config;
    rules = service.fullConfig?.rules;
  }

  return {
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
    config, // 包含 URLs, Method 等
    rules, // 包含校验规则
  };
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
