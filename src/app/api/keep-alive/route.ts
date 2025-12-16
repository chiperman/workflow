import { NextResponse } from 'next/server';
import { runKeepAlive } from '@/lib/keep-alive';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request: Request) {
    // Verify if needed (e.g. check for CRON_SECRET header if you want to secure it strictly)
    // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` if configured.
    // For simplicity here, we will just run it.

    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let result;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            result = await runKeepAlive();
            if (result.success) {
                return NextResponse.json(result, { status: 200 });
            }
            throw new Error(result.message || 'Unknown failure');
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === MAX_RETRIES) {
                return NextResponse.json(
                    { success: false, message: `Failed after ${MAX_RETRIES} attempts. Last error: ${error instanceof Error ? error.message : String(error)}` },
                    { status: 500 }
                );
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return NextResponse.json({ success: false, message: 'Unexpected loop exit' }, { status: 500 });
}
