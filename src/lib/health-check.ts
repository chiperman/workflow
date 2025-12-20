import { supabase } from './supabase';

/**
 * 统一的 Supabase 健康检查函数
 * 同时检查服务状态和获取统计数据
 */
export async function checkSupabaseHealth(): Promise<{
    status: 'operational' | 'misconfigured' | 'outage';
    tableExists: boolean;
    stats: { auto_count: number; manual_count: number };
    message?: string;
}> {
    try {
        const { data, error } = await supabase
            .from('keep_alive')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            // PGRST116: 表存在但没有数据
            if (error.code === 'PGRST116') {
                return {
                    status: 'operational',
                    tableExists: true,
                    stats: { auto_count: 0, manual_count: 0 }
                };
            }
            // 42P01: 表不存在
            if (error.code === '42P01') {
                return {
                    status: 'misconfigured',
                    tableExists: false,
                    stats: { auto_count: 0, manual_count: 0 },
                    message: 'Table "keep_alive" does not exist'
                };
            }
            throw error;
        }

        return {
            status: 'operational',
            tableExists: true,
            stats: {
                auto_count: data?.auto_count || 0,
                manual_count: data?.manual_count || 0
            }
        };
    } catch (error: any) {
        return {
            status: 'outage',
            tableExists: false,
            stats: { auto_count: 0, manual_count: 0 },
            message: error.message || 'Unknown error'
        };
    }
}

/**
 * 统一的 LeanCloud 健康检查函数
 * 同时检查服务状态和获取统计数据
 */
export async function checkLeanCloudHealth(): Promise<{
    status: 'operational' | 'misconfigured' | 'outage';
    tableExists: boolean;
    stats: { auto_count: number; manual_count: number };
    message?: string;
}> {
    const appId = process.env.LEANCLOUD_APP_ID;
    const appKey = process.env.LEANCLOUD_APP_KEY;
    const masterKey = process.env.LEANCLOUD_MASTER_KEY;
    const serverURL = process.env.LEANCLOUD_API_SERVER;

    // 检查环境变量配置
    if (!appId || !appKey || !serverURL) {
        return {
            status: 'misconfigured',
            tableExists: false,
            stats: { auto_count: 0, manual_count: 0 },
            message: 'Missing environment variables'
        };
    }

    const headers: HeadersInit = {
        'X-LC-Id': appId,
        'X-LC-Key': masterKey ? `${masterKey},master` : appKey,
        'Content-Type': 'application/json',
    };

    try {
        const queryUrl = `${serverURL}/1.1/classes/keep_alive?limit=1`;
        const queryRes = await fetch(queryUrl, { headers });

        if (!queryRes.ok) {
            // 404: 类不存在
            if (queryRes.status === 404) {
                return {
                    status: 'misconfigured',
                    tableExists: false,
                    stats: { auto_count: 0, manual_count: 0 },
                    message: 'Class "keep_alive" does not exist'
                };
            }
            throw new Error(`Query failed: ${queryRes.status}`);
        }

        const queryData = await queryRes.json();
        const record = queryData.results && queryData.results.length > 0 ? queryData.results[0] : null;

        return {
            status: 'operational',
            tableExists: true,
            stats: {
                auto_count: record?.auto_count || 0,
                manual_count: record?.manual_count || 0
            }
        };
    } catch (error: any) {
        return {
            status: 'outage',
            tableExists: false,
            stats: { auto_count: 0, manual_count: 0 },
            message: error.message || 'Unknown error'
        };
    }
}
