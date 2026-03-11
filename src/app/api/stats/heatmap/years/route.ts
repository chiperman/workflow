import { withApiHandler } from '@/lib/api-helper';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * 获取所有有记录的年份列表
 */
export const GET = withApiHandler(
  async () => {
    const { data, error } = await supabase
      .from('keep_alive_logs')
      .select('timestamp')
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const years = Array.from(
      new Set((data || []).map(log => new Date(log.timestamp).getFullYear()))
    );

    // 始终包含当前年份
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) {
      years.unshift(currentYear);
    }

    return { years: years.sort((a, b) => b - a) };
  },
  { requireAuth: true }
);
