import { withApiHandler } from '@/lib/api-helper';
import { verifyAuth } from '@/lib/auth';
import { checkAllServicesHealth } from '@/lib/health-check';

export const dynamic = 'force-dynamic';

/**
 * 全系统健康检查接口
 * 聚合所有服务的当前状态、统计信息及权限身份
 */
export const GET = withApiHandler(async request => {
  const authResult = verifyAuth(request);
  const services = await checkAllServicesHealth();

  return {
    status: 'Operational',
    auth: {
      type: authResult.type,
    },
    services,
  };
});
