import { withApiHandler } from '@/lib/api-helper';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 获取所有服务配置
 */
export const GET = withApiHandler(
  async () => {
    const { data, error } = await supabase
      .from('keep_alive')
      .select('*')
      .order('service', { ascending: true });

    if (error) throw error;
    return data;
  },
  { requireAuth: true }
);

/**
 * 允许更新的字段白名单 (对应 keep_alive 表结构)
 */
const ALLOWED_CONFIG_KEYS = [
  'name',
  'description',
  'category',
  'type',
  'config',
  'rules',
  'notification_level',
  'enabled',
];

/**
 * 更新完整的服务配置
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

    // 过滤掉不在白名单中的字段 (如 status, stats, todayCheckedIn, id 等)
    // 避免 Supabase 因为列不存在而报错
    const configToUpdate: Record<string, unknown> = {};
    ALLOWED_CONFIG_KEYS.forEach(key => {
      if (key in body && body[key] !== undefined) {
        configToUpdate[key] = body[key];
      }
    });

    // 确保 rules 内部的 smart_matching 能够被正确序列化 (rules 是 JSONB 类型)
    const { error } = await supabase
      .from('keep_alive')
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

    // 构造插入对象，确保只包含合法列
    const configToInsert: Record<string, unknown> = { service };
    ALLOWED_CONFIG_KEYS.forEach(key => {
      if (key in body && body[key] !== undefined) {
        configToInsert[key] = body[key];
      }
    });

    const { error } = await supabase.from('keep_alive').insert([configToInsert]);
    if (error) throw error;

    return { message: `Service ${service} created` };
  },
  { requireAuth: true }
);

/**
 * 删除服务配置
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

    const { error } = await supabase.from('keep_alive').delete().eq('service', service);
    if (error) throw error;

    return { message: `Service ${service} deleted` };
  },
  { requireAuth: true }
);

/**
 * 更新服务启用状态 (包含细粒度权限检查)
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

    const { error } = await supabase.from('keep_alive').update({ enabled }).eq('service', service);
    if (error) throw error;

    return { service, enabled };
  },
  { requireAuth: true, requiredPermission: 'manual' }
);
