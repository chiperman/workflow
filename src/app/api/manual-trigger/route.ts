import { NextResponse } from 'next/server';
import { runKeepAlive } from '@/lib/supabase-keep-alive';
import { withRetry } from '@/lib/utils';

export async function POST() {
    try {
        const result = await withRetry(async () => {
            const res = await runKeepAlive('manual');
            if (!res.success) throw new Error(res.message);
            return res;
        });
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
