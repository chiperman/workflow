import { handleKeepAliveRequest, withApiHandler } from '@/lib/api-helper';
import { ServiceFactory } from '@/services/ServiceFactory';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 统一任务执行接口
 * POST /api/tasks/[id]
 */
export const POST = withApiHandler(async (request, params) => {
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ success: false, message: 'Task ID is required' }, { status: 400 });
  }

  const service = await ServiceFactory.getService(id);
  if (!service) {
    return NextResponse.json(
      { success: false, message: `Service "${id}" not found` },
      { status: 404 }
    );
  }

  return handleKeepAliveRequest(request, service);
});

/**
 * 获取单个任务详情 (用于配置回显)
 */
export const GET = withApiHandler(
  async (_request, params) => {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Task ID is required' }, { status: 400 });
    }

    const service = await ServiceFactory.getService(id);
    if (!service) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    return service.getStats();
  },
  { requireAuth: true }
);
