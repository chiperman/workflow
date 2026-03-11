import { aggregateByDay } from '@/lib/heatmap-utils';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

/**
 * 获取指定年份的热力图聚合数据 (仅限服务端调用)
 */
export async function getHeatmapData(year: number) {
  try {
    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    const { data: rawData, error } = await supabase
      .from('keep_alive_logs')
      .select('service, status, timestamp')
      .gte('timestamp', startOfYear)
      .lte('timestamp', endOfYear)
      .order('timestamp', { ascending: true });

    if (error) {
      logger.error('[Heatmap Service] Supabase query failed:', error.message);
      throw error;
    }

    return aggregateByDay(rawData || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Heatmap Service] Unexpected error:', message);
    throw error;
  }
}
