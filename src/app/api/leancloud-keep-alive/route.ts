import { NextResponse } from 'next/server';
import LC from 'leancloud-storage';
import { sendBarkNotification } from '@/lib/bark';

export const dynamic = 'force-dynamic';

export async function GET() {
    const start = Date.now();
    const appId = process.env.LEANCLOUD_APP_ID;
    const appKey = process.env.LEANCLOUD_APP_KEY;
    const masterKey = process.env.LEANCLOUD_MASTER_KEY;
    const serverURL = process.env.LEANCLOUD_API_SERVER;

    if (!appId || !appKey || !serverURL) {
        const errorMsg = 'Missing LeanCloud environment variables';
        if (!masterKey) {
            console.warn('LEANCLOUD_MASTER_KEY is missing. Operations might fail due to ACL.');
        }
        if (!appId || !appKey || !serverURL) {
            console.error(errorMsg);
            await sendBarkNotification('LeanCloud Keep-Alive Failed', errorMsg);
            return NextResponse.json(
                { error: errorMsg },
                { status: 500 }
            );
        }
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            // Initialize LeanCloud
            if (!LC.applicationId) { // check if already initialized to avoid re-init errors if possible, or just init is safe usually
                LC.init({
                    appId,
                    appKey,
                    masterKey,
                    serverURL,
                });
            }

            const query = new LC.Query('keep_alive');
            const existingRecord = await query.first() as LC.Object | null;

            let message = '';
            let action = '';

            if (existingRecord) {
                await existingRecord.save({
                    timestamp: new Date(),
                    triggeredBy: 'cron-job (update)',
                }, { useMasterKey: true });
                action = 'updated';
                message = 'Existing keep-alive record updated.';
            } else {
                const KeepAlive = LC.Object.extend('keep_alive');
                const newRecord = new KeepAlive();
                await newRecord.save({
                    triggeredBy: 'cron-job (create)',
                    timestamp: new Date(),
                }, { useMasterKey: true });
                action = 'created';
                message = 'New keep-alive record created.';
            }

            const duration = Date.now() - start;
            const successMsg = `LeanCloud Keep-Alive Success: ${message} Duration: ${duration}ms.`;
            console.log(successMsg);
            await sendBarkNotification('LeanCloud Keep-Alive Success', successMsg);

            return NextResponse.json({
                status: 'success',
                action,
                message,
                duration,
            });

        } catch (error: any) {
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt === MAX_RETRIES) {
                const duration = Date.now() - start;
                const errorMsg = `LeanCloud Keep-Alive Failed after ${MAX_RETRIES} attempts. Last error: ${error.message}. Duration: ${duration}ms.`;
                await sendBarkNotification('LeanCloud Keep-Alive Failed', errorMsg);
                return NextResponse.json(
                    { error: 'Failed to execute keep-alive logic after retries', details: error.message },
                    { status: 500 }
                );
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return NextResponse.json(
        { error: 'Unexpected execution flow' },
        { status: 500 }
    );
}
