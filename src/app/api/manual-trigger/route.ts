import { NextResponse } from 'next/server';
import { runKeepAlive } from '@/lib/keep-alive';

export async function POST() {
    const result = await runKeepAlive();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
