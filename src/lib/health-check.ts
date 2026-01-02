import type { ServiceHealth } from '@/types';
import { leanCloudService } from './services/LeanCloudService';
import { supabaseService } from './services/SupabaseService';

/**
 * 统一的 Supabase 健康检查函数
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const result = await supabaseService.getStats();

  if (!result.success) {
    return {
      status: 'outage',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0 },
      message: result.error,
    };
  }

  return {
    status: result.tableExists ? 'operational' : 'misconfigured',
    tableExists: result.tableExists,
    stats: result.data || { auto_count: 0, manual_count: 0 },
    message: result.tableExists ? undefined : 'Table "keep_alive" does not exist',
  };
}

/**
 * 统一的 LeanCloud 健康检查函数
 */
export async function checkLeanCloudHealth(): Promise<ServiceHealth> {
  const result = await leanCloudService.getStats();

  if (!result.success) {
    return {
      status: 'outage',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0 },
      message: result.error,
    };
  }

  return {
    status: result.tableExists ? 'operational' : 'misconfigured',
    tableExists: result.tableExists,
    stats: result.data || { auto_count: 0, manual_count: 0 },
    message: result.tableExists ? undefined : 'Class "keep_alive" does not exist',
  };
}
