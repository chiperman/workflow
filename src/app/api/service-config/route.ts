import { checkTriggerPermission, verifyAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 服务配置 API
 * GET: 获取所有服务配置
 * PATCH: 更新服务的 enabled 状态
 * PUT: 更新完整的服务配置
 */
export async function GET(request: Request) {
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('keep_alive')
      .select('*')
      .order('service', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  try {
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

    return NextResponse.json({ success: true, message: `Service ${service} updated` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  try {
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

    return NextResponse.json({ success: true, message: `Service ${service} created` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    // 不允许删除核心内置服务 (可选的安全策略)
    if (['supabase', 'glados'].includes(service.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete core system services' },
        { status: 403 }
      );
    }

    const { error } = await supabase.from('keep_alive').delete().eq('service', service);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Service ${service} deleted` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // 1. 统一鉴权与授权检查 (操作类型：manual)
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  const permission = checkTriggerPermission(authResult.type, 'manual');
  if (!permission.ok) {
    return NextResponse.json({ success: false, message: permission.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { service, enabled } = body;

    // 验证请求体
    if (!service || typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body. Required: { service: string, enabled: boolean }',
        },
        { status: 400 }
      );
    }

    // 验证服务名称是否存在
    const { data: exists } = await supabase
      .from('keep_alive')
      .select('service')
      .eq('service', service)
      .single();

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid service: ${service}. Service not found in database.`,
        },
        { status: 400 }
      );
    }

    // 更新数据库
    const { error } = await supabase.from('keep_alive').update({ enabled }).eq('service', service);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      service,
      enabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
