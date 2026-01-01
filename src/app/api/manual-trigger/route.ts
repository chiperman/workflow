import { sendBarkNotification } from '@/lib/bark';
import { runKeepAlive } from '@/lib/supabase-keep-alive';
import { withRetry } from '@/lib/utils';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await withRetry(async () => {
      const res = await runKeepAlive('manual');
      if (!res.success) throw new Error(res.message);
      return res;
    });

    // 所有重试成功后发送成功通知
    await sendBarkNotification('✅ Manual Trigger Success', result.message, 'Manual-Success');
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // 所有重试失败后才发送失败通知
    const failureMessage = errorMessage || 'Manual trigger failed';
    await sendBarkNotification('❌ Manual Trigger Failed', failureMessage, 'Manual-Failed');

    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
