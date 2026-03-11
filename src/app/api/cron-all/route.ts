import { env } from '@/lib/env';
import { ServiceFactory } from '@/lib/services/ServiceFactory';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 统一 cron job 端点
 * 从数据库加载所有启用的服务并并行执行
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  // 验证 cron secret
  if (env.cron?.secret) {
    if (authHeader !== `Bearer ${env.cron.secret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized (Cron)' }, { status: 401 });
    }
  }

  // 动态获取所有启用的服务
  const enabledServices = await ServiceFactory.getAllEnabledServices();

  if (enabledServices.length === 0) {
    return NextResponse.json({ success: true, message: 'No enabled services found' });
  }

  // 并行执行所有服务
  const resultsArr = await Promise.all(
    enabledServices.map(async service => {
      const result = await service.run('auto');
      return { service: service.name, ...result };
    })
  );

  // 构建响应对象 { [serviceName]: result }
  const results = resultsArr.reduce(
    (acc, curr) => {
      const key = curr.service.toLowerCase();
      acc[key] = curr;
      return acc;
    },
    {} as Record<string, unknown>
  );

  // 整体状态：只要有一个成功就返回 200
  const hasSuccess = resultsArr.some(r => r.success);
  const status = hasSuccess ? 200 : 500;

  return NextResponse.json(results, { status });
}
