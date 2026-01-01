import { NextResponse } from 'next/server';
import { checkSupabaseHealth, checkLeanCloudHealth } from '@/lib/health-check';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 并行检查两个服务
  const [supabaseCheck, leancloudCheck] = await Promise.all([
    checkSupabaseHealth(),
    checkLeanCloudHealth(),
  ]);

  // 确定整体状态
  const isHealthy =
    supabaseCheck.status === 'operational' && leancloudCheck.status === 'operational';

  const overallStatus = isHealthy ? 'Operational' : 'Degraded';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      supabase: supabaseCheck,
      leancloud: leancloudCheck,
    },
  });
}
