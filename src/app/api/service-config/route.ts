import { withApiHandler } from '@/lib/api-helper';
import { supabase } from '@/lib/supabase';
import { DbServiceConfig, DbServiceJoined, DbServiceStats } from '@/types';
import { NextResponse } from 'next/server';
import {
  encryptSecretConfig,
  maskSecretConfig,
  normalizeConfigSegments,
  normalizeStoredConfigSegments,
  resolveUpdatedConfigSegments,
} from '@/lib/crypto';

export const dynamic = 'force-dynamic';

/**
 * 获取所有服务配置（联表查询统计信息）
 */
export const GET = withApiHandler(
  async () => {
    const { data, error } = await supabase
      .from('service_configs')
      .select('*, service_stats(*)')
      .order('service', { ascending: true });

    if (error) throw error;

    // 平铺嵌套数据以保持前端 ServiceConfig 类型兼容
    return (data as unknown[]).map((item: unknown) => {
      const row = item as DbServiceJoined;
      const rawStats = row.service_stats;
      const stats = (Array.isArray(rawStats) ? rawStats[0] : rawStats) as
        | DbServiceStats
        | undefined;

      const s = stats || {
        manual_count: 0,
        auto_count: 0,
        failure_count: 0,
        last_run_at: null,
        updated_at: '',
      };

      const result = {
        ...row,
        ...normalizeStoredConfigSegments(row.config, row.secret_config || {}),
        manual_count: s.manual_count,
        auto_count: s.auto_count,
        failure_count: s.failure_count,
        last_run_at: s.last_run_at || undefined,
        timestamp: s.updated_at || row.created_at,
      };

      return {
        ...result,
        secret_config: maskSecretConfig(result.secret_config || {}),
      };
    });
  },
  { requireAuth: true }
);

/**
 * 允许更新的配置字段白名单
 */
const ALLOWED_CONFIG_KEYS = [
  'name',
  'description',
  'category',
  'type',
  'config',
  'secret_config',
  'rules',
  'notification_level',
  'enabled',
];

async function getExistingConfig(service: string) {
  const { data, error } = await supabase
    .from('service_configs')
    .select('config, secret_config')
    .eq('service', service)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 更新服务配置
 */
export const PUT = withApiHandler(
  async request => {
    const body = await request.json();
    const service = body.service;

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const existing = await getExistingConfig(service);
    const resolvedSegments =
      ('config' in body && body.config !== undefined) ||
      ('secret_config' in body && body.secret_config !== undefined)
        ? resolveUpdatedConfigSegments({
            existingConfig: existing?.config || {},
            existingSecretConfig: existing?.secret_config || {},
            ...('config' in body ? { incomingConfig: body.config } : {}),
            ...('secret_config' in body ? { incomingSecretConfig: body.secret_config } : {}),
          })
        : null;

    const configToUpdate: Partial<DbServiceConfig> = {};
    if (body.name !== undefined) configToUpdate.name = body.name;
    if (body.description !== undefined) configToUpdate.description = body.description;
    if (body.category !== undefined) configToUpdate.category = body.category;
    if (body.type !== undefined) configToUpdate.type = body.type;
    if (body.rules !== undefined) configToUpdate.rules = body.rules;
    if (body.notification_level !== undefined)
      configToUpdate.notification_level = body.notification_level;
    if (body.enabled !== undefined) configToUpdate.enabled = body.enabled;

    if (resolvedSegments) {
      configToUpdate.config = resolvedSegments.config;
      configToUpdate.secret_config = encryptSecretConfig(resolvedSegments.secret_config);
    }

    const { error } = await supabase
      .from('service_configs')
      .update(configToUpdate)
      .eq('service', service);
    if (error) throw error;

    return { message: `Service ${service} updated` };
  },
  { requireAuth: true }
);

/**
 * 创建新服务配置
 */
export const POST = withApiHandler(
  async request => {
    const body = await request.json();
    const service = body.service;

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const normalizedIncoming = normalizeConfigSegments(body.config || {}, body.secret_config || {});
    const configToInsert: Record<string, unknown> = { service };
    ALLOWED_CONFIG_KEYS.forEach(key => {
      if (key in body && body[key] !== undefined) {
        if (key === 'config') {
          configToInsert[key] = normalizedIncoming.config;
          return;
        }
        if (key === 'secret_config') {
          configToInsert[key] = encryptSecretConfig(normalizedIncoming.secret_config);
          return;
        }
        configToInsert[key] = body[key];
      }
    });

    if (!('config' in configToInsert)) {
      configToInsert.config = normalizedIncoming.config;
    }
    if (!('secret_config' in configToInsert)) {
      configToInsert.secret_config = encryptSecretConfig(normalizedIncoming.secret_config);
    }

    const { error } = await supabase.from('service_configs').insert([configToInsert]);
    if (error) throw error;

    return { message: `Service ${service} created` };
  },
  { requireAuth: true }
);

/**
 * 删除服务配置 (级联删除会自动清理 stats)
 */
export const DELETE = withApiHandler(
  async request => {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    if (['supabase', 'glados'].includes(service.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete core system services' },
        { status: 403 }
      );
    }

    const { error } = await supabase.from('service_configs').delete().eq('service', service);
    if (error) throw error;

    return { message: `Service ${service} deleted` };
  },
  { requireAuth: true }
);

/**
 * 更新服务启用状态
 */
export const PATCH = withApiHandler(
  async request => {
    const body = await request.json();
    const { service, enabled } = body;

    if (!service || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('service_configs')
      .update({ enabled })
      .eq('service', service);
    if (error) throw error;

    return { service, enabled };
  },
  { requireAuth: true, requiredPermission: 'manual' }
);
