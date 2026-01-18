import { checkTriggerPermission, verifyAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { BaseService } from './services/BaseService';

/**
 * 统一处理 Keep-Alive API 请求
 */
export async function handleKeepAliveRequest(request: Request, service: BaseService) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // 1. 验证权限
  // v0.4.1：根据 HTTP 方法自动推断默认 trigger
  // POST -> manual (手动控制台), GET -> auto (定时任务)
  const defaultTrigger = request.method === 'POST' ? 'manual' : 'auto';
  const triggerParam = searchParams.get('trigger');
  const trigger =
    triggerParam === 'manual' || triggerParam === 'auto' ? triggerParam : defaultTrigger;

  // 特例：mode === 'status' 始终允许匿名查看，便于展示系统状态
  if (mode !== 'status') {
    const authResult = verifyAuth(request);

    // 1. 身份验证 (Authentication)
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    // 2. 权限检查 (Authorization)
    const permission = checkTriggerPermission(authResult.type, trigger as 'auto' | 'manual');
    if (!permission.authorized) {
      return NextResponse.json({ success: false, message: permission.message }, { status: 401 });
    }
  }

  // 2. 如果请求统计数据
  if (mode === 'status') {
    const stats = await service.getStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    });
  }

  // 3. 执行保活逻辑

  try {
    const result = await service.run(trigger);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
