import { NextResponse } from 'next/server';
import { runLeanCloudKeepAlive, getLeanCloudStats } from '@/lib/leancloud-keep-alive';
import { withRetry } from '@/lib/utils';
import { sendBarkNotification } from '@/lib/bark';

export const dynamic = 'force-dynamic';

// LeanCloud REST API Implementation
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // Return stats if requested
    if (mode === 'status') {
        const stats = await getLeanCloudStats();
        return NextResponse.json(stats);
    }

    const triggerParam = searchParams.get('trigger');
    // Security/Safety: Only allow 'manual' if explicitly requested, otherwise default to 'auto'
    const trigger = triggerParam === 'manual' ? 'manual' : 'auto';

    try {
        const result = await withRetry(async () => {
            const res = await runLeanCloudKeepAlive(trigger);
            if (!res.success) {
                throw new Error(res.message);
            }
            return res;
        });

        // Send success notification after all retries succeeded
        await sendBarkNotification('✅ LeanCloud Keep-Alive Success', result.message, 'LeanCloud-Success');
        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error('All retries failed:', error);

        // Send failure notification only after all retries failed
        const failureMessage = error.message || 'Keep-alive logic failed';
        await sendBarkNotification('❌ LeanCloud Keep-Alive Failed', failureMessage, 'LeanCloud-Failed');

        return NextResponse.json(
            { error: 'Keep-alive logic failed', details: error.message },
            { status: 500 }
        );
    }
}
