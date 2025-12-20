import { supabase } from './supabase';
import { sendBarkNotification } from './bark';

/**
 * Runs the Supabase keep-alive logic.
 * Updates the 'keep_alive' table with execution counts.
 * 
 * @param trigger 'auto' (cron) or 'manual' (user)
 */
export async function runKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}> {
    const start = Date.now();
    try {
        // 1. Try to fetch existing record
        // Assuming we use a single record with ID 1
        const { data: existing, error: fetchError } = await supabase
            .from('keep_alive')
            .select('*')
            .eq('id', 1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Relation missing" or "no rows", handle strictly if needed, but here mostly "row not found"
            // If table doesn't exist, this might fail with a different code. 
            // We assume table exists as per requirements.
            if (fetchError.code !== 'PGRST116') {
                throw fetchError;
            }
        }

        let manualCount = existing?.manual_count || 0;
        let autoCount = existing?.auto_count || 0;

        // 2. Increment counters
        if (trigger === 'manual') manualCount++;
        else autoCount++;

        // 3. Upsert record
        const { data: upsertData, error: upsertError } = await supabase
            .from('keep_alive')
            .upsert({
                id: 1,
                timestamp: new Date().toISOString(),
                manual_count: manualCount,
                auto_count: autoCount
            })
            .select() // Return the updated data
            .single();

        if (upsertError) {
            throw upsertError;
        }

        const duration = Date.now() - start;
        const beijingTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

        const message = `Supabase Keep-Alive Success: Updated record at ${beijingTime} (${trigger} run). Counts: Auto=${autoCount}, Manual=${manualCount}. Duration: ${duration}ms.`;
        console.log(message);
        await sendBarkNotification('✅ Supabase Keep-Alive Success', message, 'Supabase-Success');
        return { success: true, message, data: upsertData };

    } catch (error: any) {
        const duration = Date.now() - start;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const message = `❌ Supabase Keep-Alive Failed\n• Error: ${error.message}\n• Duration: ${duration}ms\n• Time: ${timestamp}`;
        console.error(message.replace(/\n/g, ' | '));
        await sendBarkNotification('❌ Supabase Keep-Alive Failed', message, 'Supabase-Failed');
        return { success: false, message, error: error.message };
    }
}

/**
 * Fetches the current execution stats from Supabase.
 */
export async function getSupabaseStats(): Promise<{
    success: boolean;
    data?: { manual_count: number; auto_count: number };
    error?: string;
}> {
    try {
        const { data: existing, error } = await supabase
            .from('keep_alive')
            .select('manual_count, auto_count')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return {
            success: true,
            data: {
                manual_count: existing?.manual_count || 0,
                auto_count: existing?.auto_count || 0
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
