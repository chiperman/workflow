import type { ServiceHealth } from '@/types';
import { gladosService } from './services/GladosService';
import { supabaseService } from './services/SupabaseService';

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
    };
  }

  const { enabled, tableExists, ...stats } = result.data;

  // 如果 tableExists 为 false (虽然在 Result 模式下通常意味着 ok: false，但为了兼容逻辑保留)
  // 实际上上面的 !ok 已经覆盖了大部分错误

  return {
    status: 'operational',
    tableExists,
    stats,
    enabled,
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
    };
  }

  const { enabled, tableExists, ...stats } = result.data;

  return {
    status: 'operational',
    tableExists,
    stats,
    enabled,
  };
}
