import { verifyAuth } from '@/lib/auth';
import { checkAllServicesHealth } from '@/lib/health-check';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 鉴权检查 (允许公开访问，但如果有凭证则记录身份)
  const authResult = verifyAuth(request);

  const services = await checkAllServicesHealth();

  const isHealthy = Object.values(services).every(s => s.status === 'operational');

  const overallStatus = isHealthy ? 'Operational' : 'Degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      auth: {
        type: authResult.type,
      },
      services,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
