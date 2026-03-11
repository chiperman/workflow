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
 * 更新完整的服务配置
 */
export const PUT = withApiHandler(
  async request => {
    const body = await request.json();
    const { service, ...config } = body;

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('keep_alive').update(config).eq('service', service);
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
    const { service } = body;

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('keep_alive').insert([body]);
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
