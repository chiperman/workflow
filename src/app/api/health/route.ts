import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import LC from 'leancloud-storage';

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
        const serverURL = process.env.LEANCLOUD_API_SERVER;

        if (appId && appKey && serverURL) {
            if (!LC.applicationId) {
                LC.init({ appId, appKey, serverURL });
            }
            const query = new LC.Query('keep_alive');
            await query.limit(1).first();
            status.leancloud = 'operational';
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
