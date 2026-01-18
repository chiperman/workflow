import { verifyAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 获取有数据的年份列表
 * 用于热力图年份选择器
 */
export async function GET(request: NextRequest) {
  // 鉴权检查
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  try {
    // 查询最早和最晚的日志时间戳
    const { data, error } = await supabase
      .from('keep_alive_logs')
      .select('timestamp')
      .order('timestamp', { ascending: true })
      .limit(1);

    if (error) {
      logger.error('[Heatmap Years API] Supabase query failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const currentYear = new Date().getFullYear();

    // 如果没有数据，只返回当前年份
    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, years: [currentYear] });
    }

    // 计算最早数据的年份
    const earliestYear = new Date(data[0].timestamp).getFullYear();

    // 生成从最早年份到当前年份的列表
    const years: number[] = [];
    for (let y = currentYear; y >= earliestYear; y--) {
      years.push(y);
    }

    return NextResponse.json({ success: true, years });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[Heatmap Years API] Unexpected error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
