import type { ServiceHealth } from '@/types';
import { gladosService } from './services/GladosService';
import { supabaseService } from './services/SupabaseService';

/**
 * 统一的 Supabase 健康检查函数
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const result = await supabaseService.getStats();

  if (!result.success) {
    return {
      status: 'misconfigured',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      message: 'Database setup required. Please execute the SQL setup.',
    };
  }

  if (result.tableExists === false) {
    return {
      status: 'misconfigured',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      message: 'Table "keep_alive" does not exist. Please execute the SQL setup.',
    };
  }

  return {
    status: 'operational',
    tableExists: true,
    stats: result.data || { auto_count: 0, manual_count: 0, failure_count: 0 },
    enabled: result.enabled,
  };
}

/**
 * 统一的 GLaDOS 健康检查函数
 */
export async function checkGladosHealth(): Promise<ServiceHealth> {
  const result = await gladosService.getStats();

  if (!result.success) {
    return {
      status: 'misconfigured',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      message: 'Database setup required. Please execute the SQL setup.',
    };
  }

  if (result.tableExists === false) {
    return {
      status: 'misconfigured',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0, failure_count: 0 },
      message: 'Table "keep_alive" does not exist. Please execute the SQL setup.',
    };
  }

  return {
    status: 'operational',
    tableExists: true,
    stats: result.data || { auto_count: 0, manual_count: 0, failure_count: 0 },
    enabled: result.enabled,
  };
}
