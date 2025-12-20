import { NextResponse } from 'next/server';
import { runLeanCloudKeepAlive, getLeanCloudStats } from '@/lib/leancloud-keep-alive';
import { withRetry } from '@/lib/utils';

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

        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error('All retries failed:', error);
        return NextResponse.json(
            { error: 'Keep-alive logic failed', details: error.message },
            { status: 500 }
        );
    }
}
