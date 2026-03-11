import { VALID_SERVICES } from '@/config/constants';
import { checkTriggerPermission, verifyAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 服务配置 API
 * PATCH: 更新服务的 enabled 状态
 */
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

    // 验证服务名称
    if (!VALID_SERVICES.includes(service)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid service. Must be one of: ${VALID_SERVICES.join(', ')}`,
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
