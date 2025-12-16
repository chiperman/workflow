import { NextResponse } from 'next/server';
import { sendBarkNotification } from '@/lib/bark';

export const dynamic = 'force-dynamic';

// LeanCloud REST API Implementation
export async function GET() {
    const start = Date.now();
    const appId = process.env.LEANCLOUD_APP_ID;
    const appKey = process.env.LEANCLOUD_APP_KEY;
    const masterKey = process.env.LEANCLOUD_MASTER_KEY;
    const serverURL = process.env.LEANCLOUD_API_SERVER;

    if (!appId || !appKey || !serverURL) {
        const errorMsg = 'Missing LeanCloud environment variables';
        console.error(errorMsg);
        await sendBarkNotification('LeanCloud Keep-Alive Failed', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    // Headers for LeanCloud REST API
    // Use Master Key if available to bypass ACL
    const headers: HeadersInit = {
        'X-LC-Id': appId,
        'X-LC-Key': masterKey ? `${masterKey},master` : appKey,
        'Content-Type': 'application/json',
    };

    if (!masterKey) {
        console.warn('LEANCLOUD_MASTER_KEY is missing. Write operations might fail due to ACL.');
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            // 1. Query for existing record
            const queryUrl = `${serverURL}/1.1/classes/keep_alive?limit=1`;
            const queryRes = await fetch(queryUrl, { headers });

            if (!queryRes.ok) {
                const errText = await queryRes.text();
                throw new Error(`Query failed: ${queryRes.status} ${errText}`);
            }

            const queryData = await queryRes.json();
            const existingRecord = queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;

            let message = '';
            let action = '';

            if (existingRecord) {
                // 2. Update existing record
                const updateUrl = `${serverURL}/1.1/classes/keep_alive/${existingRecord.objectId}`;
                const updateRes = await fetch(updateUrl, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        timestamp: { __type: 'Date', iso: new Date().toISOString() },
                        triggeredBy: 'cron-job (update-rest)',
                    }),
                });

                if (!updateRes.ok) {
                    const errText = await updateRes.text();
                    throw new Error(`Update failed: ${updateRes.status} ${errText}`);
                }

                action = 'updated';
                message = 'Existing keep-alive record updated via REST.';
            } else {
                // 3. Create new record
                const createUrl = `${serverURL}/1.1/classes/keep_alive`;
                const createRes = await fetch(createUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        timestamp: { __type: 'Date', iso: new Date().toISOString() },
                        triggeredBy: 'cron-job (create-rest)',
                    }),
                });

                if (!createRes.ok) {
                    const errText = await createRes.text();
                    throw new Error(`Create failed: ${createRes.status} ${errText}`);
                }

                action = 'created';
                message = 'New keep-alive record created via REST.';
            }

            const duration = Date.now() - start;
            const successMsg = `LeanCloud Keep-Alive Success (REST): ${message} Duration: ${duration}ms.`;
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
                const errorMsg = `LeanCloud Keep-Alive Failed after ${MAX_RETRIES} attempts (REST). Last error: ${error.message}. Duration: ${duration}ms.`;
                await sendBarkNotification('LeanCloud Keep-Alive Failed', errorMsg);
                return NextResponse.json(
                    { error: 'Keep-alive logic failed', details: error.message },
                    { status: 500 }
                );
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return NextResponse.json({ error: 'Unexpected flow' }, { status: 500 });
}
