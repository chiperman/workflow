import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    const status = {
        supabase: 'unknown',
        leancloud: 'unknown',
    };

    // 1. Check Supabase
    try {
        const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) throw error;
        status.supabase = 'operational';
    } catch (error) {
        console.error('Health Check - Supabase Error:', error);
        status.supabase = 'outage';
    }

    // 2. Check LeanCloud
    try {
        const appId = process.env.LEANCLOUD_APP_ID;
        const appKey = process.env.LEANCLOUD_APP_KEY;
        const masterKey = process.env.LEANCLOUD_MASTER_KEY;
        const serverURL = process.env.LEANCLOUD_API_SERVER;

        if (appId && appKey && serverURL) {
            const headers: HeadersInit = {
                'X-LC-Id': appId,
                'X-LC-Key': masterKey ? `${masterKey},master` : appKey,
                'Content-Type': 'application/json',
            };

            // Perform a lightweight query using REST API
            const res = await fetch(`${serverURL}/1.1/classes/keep_alive?limit=1`, { headers });

            if (res.ok) {
                status.leancloud = 'operational';
            } else {
                console.warn(`Health Check - LeanCloud returned ${res.status}`);
                status.leancloud = 'outage';
            }
        } else {
            status.leancloud = 'misconfigured';
        }
    } catch (error) {
        console.error('Health Check - LeanCloud Error:', error);
        status.leancloud = 'outage';
    }

    // Determine Overall Status
    const isHealthy = status.supabase === 'operational' && status.leancloud === 'operational';
    const overallStatus = isHealthy ? 'Operational' : 'Degraded';

    return NextResponse.json({
        status: overallStatus,
        details: status,
        timestamp: new Date().toISOString(),
    });
}
