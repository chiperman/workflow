import { aggregateByDay } from '@/lib/heatmap-utils';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { HeatmapData } from '@/types';

/**
 * 获取指定年份的热力图聚合数据 (仅限服务端调用)
 */
export async function getHeatmapData(year: number): Promise<HeatmapData> {
  try {
    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    // 1. 获取热力图原始日志
    const { data: rawLogs, error: logError } = await supabase
      .from('keep_alive_logs')
      .select('service, status, timestamp')
      .gte('timestamp', startOfYear)
      .lte('timestamp', endOfYear)
      .order('timestamp', { ascending: true });

    if (logError) {
      logger.error('[Heatmap Service] Supabase query failed:', logError.message);
      throw logError;
    }

    // 2. 获取当前配置的所有服务列表及其创建时间 (用于动态计算生命周期)
    const { data: serviceConfigs, error: serviceError } = await supabase
      .from('keep_alive')
      .select('service, created_at')
      .eq('enabled', true);

    if (serviceError) {
      logger.error('[Heatmap Service] Failed to fetch services:', serviceError.message);
    }

    // 格式化服务列表，包含创建时间
    const services =
      serviceConfigs?.map(s => ({
        service: s.service,
        created_at: s.created_at,
      })) || [];

    const heatmap = aggregateByDay(rawLogs || []);

    return {
      heatmap,
      services,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Heatmap Service] Unexpected error:', message);
    throw error;
  }
}
