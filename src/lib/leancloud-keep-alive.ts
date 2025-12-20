import { sendBarkNotification } from './bark';

/**
 * Runs the LeanCloud keep-alive logic.
 * Checks for an existing record, and either updates it or creates a new one using the REST API.
 */
/**
 * Runs the LeanCloud keep-alive logic.
 * Checks for an existing record, and either updates it or creates a new one using the REST API.
 * 
 * @param trigger 'auto' (cron) or 'manual' (user)
 */
export async function runLeanCloudKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<{
    success: boolean;
    action?: 'updated' | 'created';
    message: string;
    duration: number;
    data?: { auto_count: number; manual_count: number };
    error?: string;
}> {
    const start = Date.now();
    const appId = process.env.LEANCLOUD_APP_ID;
    const appKey = process.env.LEANCLOUD_APP_KEY;
    const masterKey = process.env.LEANCLOUD_MASTER_KEY;
    const serverURL = process.env.LEANCLOUD_API_SERVER;

    // Headers for LeanCloud REST API
    // Use Master Key if available to bypass ACL
    const headers: HeadersInit = {
        'X-LC-Id': appId || '',
        'X-LC-Key': masterKey ? `${masterKey},master` : (appKey || ''),
        'Content-Type': 'application/json',
    };

    if (!masterKey) {
        console.warn('LEANCLOUD_MASTER_KEY is missing. Write operations might fail due to ACL.');
    }

    try {
        // 1. Query for existing record
        const queryUrl = `${serverURL}/1.1/classes/keep_alive?limit=1`;
        const queryRes = await fetch(queryUrl, { headers });

        if (!queryRes.ok) {
            // If class doesn't exist (404), it's not a fatal error, just means we need to create it.
            if (queryRes.status === 404) {
                // proceed with existingRecord = null
            } else {
                const errText = await queryRes.text();
                throw new Error(`Query failed: ${queryRes.status} ${errText}`);
            }
        }

        let existingRecord = null;
        if (queryRes.ok) {
            const queryData = await queryRes.json();
            existingRecord = queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;
        }

        let message = '';
        let action: 'updated' | 'created';
        const incrementField = trigger === 'manual' ? 'manual_count' : 'auto_count';

        let beijingTime = '';

        if (existingRecord) {
            // 2. Update existing record
            const updateUrl = `${serverURL}/1.1/classes/keep_alive/${existingRecord.objectId}`;

            // Fallback: Read current count, increment in code, then update.
            // This ensures fields are created if they don't exist.
            const currentCount = existingRecord[incrementField] || 0;
            const newCount = currentCount + 1;

            const updateBody = {
                timestamp: { __type: 'Date', iso: new Date().toISOString() },
                triggeredBy: `cron-job (update-rest) - ${trigger}`,
                [incrementField]: newCount
            };

            const updateRes = await fetch(updateUrl, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updateBody),
            });

            if (!updateRes.ok) {
                const errText = await updateRes.text();
                throw new Error(`Update failed: ${updateRes.status} ${errText}`);
            }

            const updateData = await updateRes.json();
            action = 'updated';
            beijingTime = new Date(updateData.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
        } else {
            // 3. Create new record
            const createUrl = `${serverURL}/1.1/classes/keep_alive`;
            const createBody = {
                timestamp: { __type: 'Date', iso: new Date().toISOString() },
                triggeredBy: `cron-job (create-rest) - ${trigger}`,
                manual_count: trigger === 'manual' ? 1 : 0,
                auto_count: trigger === 'auto' ? 1 : 0
            };

            const createRes = await fetch(createUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(createBody),
            });

            if (!createRes.ok) {
                const errText = await createRes.text();
                throw new Error(`Create failed: ${createRes.status} ${errText}`);
            }

            const createData = await createRes.json();
            action = 'created';
            beijingTime = new Date(createData.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
        }

        // Calculate final counts for display
        let finalAuto = 0;
        let finalManual = 0;
        if (action === 'updated' && existingRecord) {
            finalAuto = existingRecord.auto_count || 0;
            finalManual = existingRecord.manual_count || 0;
            if (trigger === 'manual') finalManual++;
            else finalAuto++;
        } else if (action === 'created') {
            if (trigger === 'manual') finalManual = 1;
            else finalAuto = 1;
        }

        const duration = Date.now() - start;
        // Standardized format matching Supabase: 
        // "Success: Updated record at Time (Trigger run). Counts: Auto=X, Manual=Y. Duration: Zms."
        // Note: LeanCloud distinguishes Created vs Updated, we keep that distinction for clarity but match the structure.
        const baseAction = action === 'created' ? 'Created new record' : 'Updated record';
        const successMsg = `LeanCloud Keep-Alive Success: ${baseAction} at ${beijingTime} (${trigger} run). Counts: Auto=${finalAuto}, Manual=${finalManual}. Duration: ${duration}ms.`;

        console.log(successMsg);

        // Note: Bark notification is now sent at the API route level to avoid duplicate notifications during retries

        return {
            success: true,
            action,
            message: successMsg,
            duration,
            data: {
                auto_count: finalAuto,
                manual_count: finalManual
            }
        };

    } catch (error: any) {
        const duration = Date.now() - start;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const errorMsg = `❌ LeanCloud Keep-Alive Failed\n• Error: ${error.message}\n• Duration: ${duration}ms\n• Time: ${timestamp}`;

        // Note: Bark notification is now sent at the API route level to avoid duplicate notifications during retries

        return {
            success: false,
            message: error.message,
            duration,
            error: error.message
        };
    }
}

/**
 * Fetches the current execution stats from LeanCloud.
 */
export async function getLeanCloudStats(): Promise<{
    success: boolean;
    data?: { manual_count: number; auto_count: number };
    tableExists?: boolean;
    error?: string;
}> {
    const appId = process.env.LEANCLOUD_APP_ID;
    const appKey = process.env.LEANCLOUD_APP_KEY;
    const masterKey = process.env.LEANCLOUD_MASTER_KEY;
    const serverURL = process.env.LEANCLOUD_API_SERVER;

    const headers: HeadersInit = {
        'X-LC-Id': appId || '',
        'X-LC-Key': masterKey ? `${masterKey},master` : (appKey || ''),
        'Content-Type': 'application/json',
    };

    try {
        const queryUrl = `${serverURL}/1.1/classes/keep_alive?limit=1`;
        const queryRes = await fetch(queryUrl, { headers });

        if (!queryRes.ok) {
            if (queryRes.status === 404) {
                return {
                    success: true,
                    data: { manual_count: 0, auto_count: 0 },
                    tableExists: false
                };
            }
            throw new Error(`Query failed: ${queryRes.status}`);
        }

        const queryData = await queryRes.json();
        const record = queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;

        return {
            success: true,
            data: {
                manual_count: record?.manual_count || 0,
                auto_count: record?.auto_count || 0
            },
            tableExists: true
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
