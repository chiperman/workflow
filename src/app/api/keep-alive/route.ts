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

    const result = await runKeepAlive();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
