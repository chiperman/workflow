import { DATABASE_CONFIG } from '@/config/constants';
import type { ServiceHealth } from '@/types';
import { env } from './env';
import { supabase } from './supabase';

/**
 * 统一的 Supabase 健康检查函数
 * 同时检查服务状态和获取统计数据
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  try {
    const { data, error } = await supabase
      .from('keep_alive')
      .select('*')
      .eq('id', DATABASE_CONFIG.KEEP_ALIVE_ID)
      .single();

    if (error) {
      // PGRST116: 表存在但没有数据
      if (error.code === 'PGRST116') {
        return {
          status: 'operational',
          tableExists: true,
          stats: { auto_count: 0, manual_count: 0 },
        };
      }
      // 42P01: 表不存在
      if (error.code === '42P01') {
        return {
          status: 'misconfigured',
          tableExists: false,
          stats: { auto_count: 0, manual_count: 0 },
          message: 'Table "keep_alive" does not exist',
        };
      }
      throw error;
    }

    return {
      status: 'operational',
      tableExists: true,
      stats: {
        auto_count: data?.auto_count || 0,
        manual_count: data?.manual_count || 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'outage',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0 },
      message: errorMessage,
    };
  }
}

/**
 * 统一的 LeanCloud 健康检查函数
 * 同时检查服务状态和获取统计数据
 */
export async function checkLeanCloudHealth(): Promise<ServiceHealth> {
  const headers: HeadersInit = {
    'X-LC-Id': env.leancloud.appId,
    'X-LC-Key': env.leancloud.masterKey
      ? `${env.leancloud.masterKey},master`
      : env.leancloud.appKey,
    'Content-Type': 'application/json',
  };

  try {
    const queryUrl = `${env.leancloud.serverUrl}/1.1/classes/keep_alive?limit=${DATABASE_CONFIG.QUERY_LIMIT}`;
    const queryRes = await fetch(queryUrl, { headers });

    if (!queryRes.ok) {
      // 404: 类不存在
      if (queryRes.status === 404) {
        return {
          status: 'misconfigured',
          tableExists: false,
          stats: { auto_count: 0, manual_count: 0 },
          message: 'Class "keep_alive" does not exist',
        };
      }
      throw new Error(`Query failed: ${queryRes.status}`);
    }

    const queryData = await queryRes.json();
    const record = queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;

    return {
      status: 'operational',
      tableExists: true,
      stats: {
        auto_count: record?.auto_count || 0,
        manual_count: record?.manual_count || 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'outage',
      tableExists: false,
      stats: { auto_count: 0, manual_count: 0 },
      message: errorMessage,
    };
  }
}
