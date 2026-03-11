import { ServiceExecutor } from '@/lib/ServiceExecutor';
import { checkTriggerPermission, verifyAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { BaseService } from '@/services/BaseService';

type ApiHandler<T> = (
  request: Request,
  params?: Record<string, string>
) => Promise<T | NextResponse>;

interface HandlerOptions {
  requireAuth?: boolean;
  requiredPermission?: 'auto' | 'manual';
}

/**
 * 核心 API 处理器包装函数
 * 处理鉴权、错误捕获及统一响应格式
 */
export function withApiHandler<T>(handler: ApiHandler<T>, options: HandlerOptions = {}) {
  return async (request: Request, context?: { params: Promise<Record<string, string>> }) => {
    try {
      const params = context ? await context.params : undefined;

      // 1. 鉴权检查 (可选)
      if (options.requireAuth) {
        const authResult = verifyAuth(request);
        if (!authResult.authorized) {
          return NextResponse.json(
            { success: false, message: authResult.message },
            { status: 401 }
          );
        }

        // 2. 权限检查 (可选)
        if (options.requiredPermission) {
          const permission = checkTriggerPermission(authResult.type, options.requiredPermission);
          if (!permission.ok) {
            return NextResponse.json(
              { success: false, message: permission.error },
              { status: 403 }
            );
          }
        }
      }

      const result = await handler(request, params);

      if (result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          message: 'Internal Server Error',
          error: message,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 统一处理 Keep-Alive API 请求 (兼容现有逻辑)
 */
export async function handleKeepAliveRequest(request: Request, service: BaseService) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const defaultTrigger = request.method === 'POST' ? 'manual' : 'auto';
  const triggerParam = searchParams.get('trigger');
  const trigger =
    triggerParam === 'manual' || triggerParam === 'auto' ? triggerParam : defaultTrigger;

  // 1. 鉴权与权限检查
  const authResult = verifyAuth(request);
  if (!authResult.authorized) {
    return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
  }

  if (mode !== 'status') {
    const permission = checkTriggerPermission(authResult.type, trigger as 'auto' | 'manual');
    if (!permission.ok) {
      return NextResponse.json({ success: false, message: permission.error }, { status: 403 });
    }
  }

  // 2. 逻辑分发
  try {
    if (mode === 'status') {
      const result = await service.getStats();
      if (!result.ok) throw new Error(result.error);

      return NextResponse.json(
        { success: true, ...result.data },
        { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
      );
    }

    const result = await ServiceExecutor.runService(service, trigger as 'auto' | 'manual');
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
