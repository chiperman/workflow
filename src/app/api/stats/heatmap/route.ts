import { verifyAuth } from '@/lib/auth';
import { aggregateByDay } from '@/lib/heatmap-utils';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 热力图数据 API
 * 支持 year 参数查询指定年份的数据
 * 默认返回当前年份的数据
 */
export async function GET(request: NextRequest) {
  // 鉴权检查
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // 计算该年份的时间范围
    const startOfYear = new Date(year, 0, 1).toISOString();
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    const { data: rawData, error } = await supabase
      .from('keep_alive_logs')
      .select('service, status, timestamp')
      .gte('timestamp', startOfYear)
      .lte('timestamp', endOfYear)
      .order('timestamp', { ascending: true });

    if (error) {
      logger.error('[Heatmap API] Supabase query failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const aggregated = aggregateByDay(rawData || []);
    return NextResponse.json({ success: true, data: aggregated, year });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Heatmap API] Unexpected error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
