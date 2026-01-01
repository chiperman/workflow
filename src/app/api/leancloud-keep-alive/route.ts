import { sendBarkNotification } from '@/lib/bark';
import { getLeanCloudStats, runLeanCloudKeepAlive } from '@/lib/leancloud-keep-alive';
import { withRetry } from '@/lib/utils';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// LeanCloud REST API 实现
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // 如果请求统计数据则直接返回
  if (mode === 'status') {
    const stats = await getLeanCloudStats();
    return NextResponse.json(stats);
  }

  const triggerParam = searchParams.get('trigger');
  // 安全性：只有明确请求时才允许 'manual'，否则默认为 'auto'
  const trigger = triggerParam === 'manual' ? 'manual' : 'auto';

  try {
    const result = await withRetry(async () => {
      const res = await runLeanCloudKeepAlive(trigger);
      if (!res.success) {
        throw new Error(res.message);
      }
      return res;
    });

    // 所有重试成功后发送成功通知
    await sendBarkNotification(
      '✅ LeanCloud Keep-Alive Success',
      result.message,
      'LeanCloud-Success'
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('All retries failed:', error);

    // 所有重试失败后才发送失败通知
    const failureMessage = errorMessage || 'Keep-alive logic failed';
    await sendBarkNotification(
      '❌ LeanCloud Keep-Alive Failed',
      failureMessage,
      'LeanCloud-Failed'
    );

    return NextResponse.json(
      { error: 'Keep-alive logic failed', details: errorMessage },
      { status: 500 }
    );
  }
}
