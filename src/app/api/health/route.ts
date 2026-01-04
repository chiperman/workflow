import { checkGladosHealth, checkLeanCloudHealth, checkSupabaseHealth } from '@/lib/health-check';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [supabaseCheck, leancloudCheck, gladosCheck] = await Promise.all([
    checkSupabaseHealth(),
    checkLeanCloudHealth(),
    checkGladosHealth(),
  ]);

  const isHealthy =
    supabaseCheck.status === 'operational' &&
    leancloudCheck.status === 'operational' &&
    gladosCheck.status === 'operational';

  const overallStatus = isHealthy ? 'Operational' : 'Degraded';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      supabase: supabaseCheck,
      leancloud: leancloudCheck,
      glados: gladosCheck,
    },
  });
}
