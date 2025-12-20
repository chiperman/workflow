import { NextResponse } from 'next/server';
import { runLeanCloudKeepAlive } from '@/lib/leancloud-keep-alive';
import { withRetry } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// LeanCloud REST API Implementation
export async function GET() {
    try {
        const result = await withRetry(async () => {
            const res = await runLeanCloudKeepAlive();
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
