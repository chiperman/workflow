import { sendBarkNotification } from '@/lib/bark';
import { env } from '@/lib/env';
import { getSupabaseStats, runKeepAlive } from '@/lib/supabase-keep-alive';
import { withRetry } from '@/lib/utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request: Request) {
  // Verify if needed (e.g. check for CRON_SECRET header if you want to secure it strictly)
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` if configured.

  const authHeader = request.headers.get('authorization');
  if (env.cron?.secret && authHeader !== `Bearer ${env.cron.secret}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // 如果请求统计数据则直接返回
  if (mode === 'status') {
    const stats = await getSupabaseStats();
    return NextResponse.json(stats);
  }

  const triggerParam = searchParams.get('trigger');
  const trigger = triggerParam === 'manual' ? 'manual' : 'auto';

  try {
    const result = await withRetry(async () => {
      const res = await runKeepAlive(trigger);
      if (!res.success) {
        throw new Error(res.message || 'Keep-alive reported failure');
      }
      return res;
    });

    // 所有重试成功后发送成功通知
    await sendBarkNotification(
      '✅ Supabase Keep-Alive Success',
      result.message,
      'Supabase-Success'
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Max retries exhausted:', error);

    // 所有重试失败后才发送失败通知
    const failureMessage = errorMessage || 'Failed after max retries';
    await sendBarkNotification('❌ Supabase Keep-Alive Failed', failureMessage, 'Supabase-Failed');

    return NextResponse.json(
      {
        success: false,
        message: 'Failed after max retries',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
