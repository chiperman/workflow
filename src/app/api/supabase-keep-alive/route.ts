import { NextResponse } from 'next/server';
import { runKeepAlive, getSupabaseStats } from '@/lib/supabase-keep-alive';
import { withRetry } from '@/lib/utils';
import { sendBarkNotification } from '@/lib/bark';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request: Request) {
    // Verify if needed (e.g. check for CRON_SECRET header if you want to secure it strictly)
    // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` if configured.

    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    // Return stats if requested
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

        // Send success notification after all retries succeeded
        await sendBarkNotification('✅ Supabase Keep-Alive Success', result.message, 'Supabase-Success');
        return NextResponse.json(result, { status: 200 });

    } catch (error: any) {
        console.error('Max retries exhausted:', error);

        // Send failure notification only after all retries failed
        const failureMessage = error.message || 'Failed after max retries';
        await sendBarkNotification('❌ Supabase Keep-Alive Failed', failureMessage, 'Supabase-Failed');

        return NextResponse.json(
            {
                success: false,
                message: 'Failed after max retries',
                error: error.message
            },
            { status: 500 }
        );
    }
}
