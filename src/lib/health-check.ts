import type { ServiceHealth } from '@/types';
import { gladosService } from './services/GladosService';
import { supabaseService } from './services/SupabaseService';
import { supabase } from './supabase';
import { getBeijingDateString } from './utils';

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
      .eq('service', service)
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
 * 统一的 Supabase 健康检查函数
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const result = await supabaseService.getStats();

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
  const todayCheckedIn = await checkTodayCheckin('supabase');

  return {
    status: 'operational',
    tableExists,
    stats,
    enabled,
    todayCheckedIn,
  };
}

/**
 * 统一的 GLaDOS 健康检查函数
 */
export async function checkGladosHealth(): Promise<ServiceHealth> {
  const result = await gladosService.getStats();

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
  const todayCheckedIn = await checkTodayCheckin('glados');

  return {
    status: 'operational',
    tableExists,
    stats,
    enabled,
    todayCheckedIn,
  };
}
