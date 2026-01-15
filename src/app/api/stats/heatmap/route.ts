import { aggregateByDay } from '@/lib/heatmap-utils';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * 热力图数据 API
 * 返回过去 12 个月的签到记录聚合数据
 */
export async function GET() {
  try {
    // 直接查询日志表（不依赖 RPC 函数）
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const { data: rawData, error } = await supabase
      .from('keep_alive_logs')
      .select('service, status, timestamp')
      .gte('timestamp', oneYearAgo)
      .order('timestamp', { ascending: true });

    if (error) {
      logger.error('[Heatmap API] Supabase query failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 在 JS 端进行聚合

    const aggregated = aggregateByDay(rawData || []);
    return NextResponse.json({ success: true, data: aggregated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Heatmap API] Unexpected error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
