import { NextResponse } from 'next/server';
import { runKeepAlive } from '@/lib/supabase-keep-alive';
import { withRetry } from '@/lib/utils';
import { sendBarkNotification } from '@/lib/bark';

export async function POST() {
    try {
        const result = await withRetry(async () => {
            const res = await runKeepAlive('manual');
            if (!res.success) throw new Error(res.message);
            return res;
        });

        // Send success notification after all retries succeeded
        await sendBarkNotification('✅ Manual Trigger Success', result.message, 'Manual-Success');
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        // Send failure notification only after all retries failed
        const failureMessage = error.message || 'Manual trigger failed';
        await sendBarkNotification('❌ Manual Trigger Failed', failureMessage, 'Manual-Failed');

        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
