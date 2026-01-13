import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 服务配置 API
 * PATCH: 更新服务的 enabled 状态
 */
export async function PATCH(request: Request) {
  // 验证权限：支持 App Key 或 Session Cookie
  const appKey = request.headers.get('x-app-key');
  const hasCookieSession = request.headers
    .get('cookie')
    ?.includes('workflow_session=authenticated');

  if (env.appKey && appKey !== env.appKey && !hasCookieSession) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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

    // 验证服务名称
    const validServices = ['supabase', 'leancloud', 'glados'];
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { success: false, message: `Invalid service. Must be one of: ${validServices.join(', ')}` },
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
