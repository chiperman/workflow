import type { KeepAliveResult, StatsQueryResult } from '@/types';
import { supabase } from './supabase';

/**
 * Runs the Supabase keep-alive logic.
 * Updates the 'keep_alive' table with execution counts.
 *
 * @param trigger 'auto' (cron) or 'manual' (user)
 */
export async function runKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
  const start = Date.now();
  try {
    // 1. Try to fetch existing record
    // Assuming we use a single record with ID 1
    const { data: existing, error: fetchError } = await supabase
      .from('keep_alive')
      .select('*')
      .eq('id', 1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "Relation missing" or "no rows", handle strictly if needed, but here mostly "row not found"
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
    const { error: upsertError } = await supabase
      .from('keep_alive')
      .upsert({
        id: 1,
        timestamp: new Date().toISOString(),
        manual_count: manualCount,
        auto_count: autoCount,
      })
      .select() // Return the updated data
      .single();

    if (upsertError) {
      throw upsertError;
    }

    const duration = Date.now() - start;
    const beijingTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });

    const action = existing ? 'Updated record' : 'Created new record';
    const message = `Supabase Keep-Alive Success: ${action} at ${beijingTime} (${trigger} run). Counts: Auto=${autoCount}, Manual=${manualCount}. Duration: ${duration}ms.`;
    console.log(message);

    // Note: Bark notification is now sent at the API route level to avoid duplicate notifications during retries
    return {
      success: true,
      message,
      duration,
      data: {
        manual_count: manualCount,
        auto_count: autoCount,
      },
    };
  } catch (error: unknown) {
    const duration = Date.now() - start;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    let customMsg = error instanceof Error ? error.message : 'Unknown error';
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      customMsg =
        "Table 'keep_alive' does not exist. Supabase requires tables to be created via SQL Editor or Dashboard. (Cannot auto-create Table)";
    }

    const message = `❌ Supabase Keep-Alive Failed\n• Error: ${customMsg}\n• Duration: ${duration}ms\n• Time: ${timestamp}`;
    console.error(message.replace(/\n/g, ' | '));

    // Note: Bark notification is now sent at the API route level to avoid duplicate notifications during retries
    return { success: false, message, duration, error: customMsg };
  }
}

/**
 * Fetches the current execution stats from Supabase.
 */
export async function getSupabaseStats(): Promise<StatsQueryResult> {
  try {
    const { data: existing, error } = await supabase
      .from('keep_alive')
      .select('manual_count, auto_count')
      .eq('id', 1)
      .single();

    if (error) {
      // PGRST116: standard "No rows found" (Table exists, but empty) -> Normal success (0 counts)
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: { manual_count: 0, auto_count: 0 },
          tableExists: true,
        };
      }
      // 42P01: "relation ... does not exist" (Table missing)
      if (error.code === '42P01') {
        return {
          success: true,
          data: { manual_count: 0, auto_count: 0 },
          tableExists: false,
        };
      }
      throw error;
    }

    return {
      success: true,
      data: {
        manual_count: existing?.manual_count || 0,
        auto_count: existing?.auto_count || 0,
      },
      tableExists: true,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
