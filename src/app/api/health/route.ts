import { verifyAuth } from '@/lib/auth';
import { checkGladosHealth, checkSupabaseHealth } from '@/lib/health-check';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 鉴权检查 (允许公开访问，但如果有凭证则记录身份)
  const authResult = verifyAuth(request);
  // 不再强制鉴权，允许 public 身份继续执行

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
      auth: {
        type: authResult.type,
      },
      services: {
        supabase: supabaseCheck,
        glados: gladosCheck,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
