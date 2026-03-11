import { ServiceExecutor } from '@/lib/ServiceExecutor';
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

  // 特例：mode === 'status' 允许公开访问 (用于主页状态展示)
  {
    const authResult = verifyAuth(request);

    // 1. 身份验证 (Authentication)
    // 如果不是公开路径且不满足鉴权，则拒绝
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }

    // 2. 权限检查 (Authorization)
    // 仅对非 status 模式 (即执行操作) 检查触发权限
    if (mode !== 'status') {
      const permission = checkTriggerPermission(authResult.type, trigger as 'auto' | 'manual');
      if (!permission.ok) {
        return NextResponse.json({ success: false, message: permission.error }, { status: 401 });
      }
    }
  }

  // 2. 如果请求统计数据
  if (mode === 'status') {
    const result = await service.getStats();

    if (result.ok) {
      return NextResponse.json(
        { success: true, ...result.data },
        {
          headers: {
            'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
          },
        }
      );
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  }

  // 3. 执行保活逻辑

  try {
    const result = await ServiceExecutor.runService(service, trigger);
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
