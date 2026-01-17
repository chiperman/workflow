import { checkGladosHealth, checkSupabaseHealth } from '@/lib/health-check';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [supabaseCheck, gladosCheck] = await Promise.all([
    checkSupabaseHealth(),
    checkGladosHealth(),
  ]);

  const isHealthy = supabaseCheck.status === 'operational' && gladosCheck.status === 'operational';

  const overallStatus = isHealthy ? 'Operational' : 'Degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseCheck,
        glados: gladosCheck,
      },
    },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    }
  );
}
