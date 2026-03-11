import { withApiHandler } from '@/lib/api-helper';
import { getHeatmapData } from '@/services/heatmap-data';

export const dynamic = 'force-dynamic';

/**
 * 获取热力图聚合数据
 * GET /api/stats/heatmap?year=2026
 */
export const GET = withApiHandler(
  async request => {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    return await getHeatmapData(year);
  },
  { requireAuth: true }
);
