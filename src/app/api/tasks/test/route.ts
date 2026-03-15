import { withApiHandler } from '@/lib/api-helper';
import { DynamicService } from '@/services/DynamicService';
import { ServiceConfig } from '@/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 实时测试任务配置 (无需保存)
 * POST /api/tasks/test
 */
export const POST = withApiHandler(
  async request => {
    const body = await request.json();

    // 构造临时服务实例
    const tempConfig: ServiceConfig = {
      ...body,
      // 填充必要的默认字段，确保 DynamicService 能正常构造
      service: body.service || 'test-service',
      manual_count: 0,
      auto_count: 0,
      failure_count: 0,
      enabled: true,
      timestamp: new Date().toISOString(),
    };

    const service = new DynamicService(tempConfig);

    // 执行测试 (仅触发 HTTP 请求，不记录数据库统计)
    // 我们需要直接调用 DynamicService 的私有方法，或者使用一个测试专用的 wrapper
    // 这里我们直接调用 run，但因为它是临时对象且没有 id 匹配，upsert 会失败，所以我们捕获并只返回执行结果

    try {
      // @ts-expect-error - 访问内部执行逻辑进行测试
      const result = await service.executeHttpRequest('manual');

      return {
        success: result.success,
        message: result.message,
        data: result.data, // 包含原始响应内容，供前端分析
        error: result.error,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { success: false, message: 'Execution failed', error: errorMessage },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
