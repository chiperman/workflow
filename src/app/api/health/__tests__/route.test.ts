/**
 * @jest-environment node
 */
import { checkAllServicesHealth } from '@/lib/health-check';
import { GET } from '../route';

jest.mock('@/lib/health-check', () => ({
  checkAllServicesHealth: jest.fn(),
}));

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('公开访问只返回粗粒度状态', async () => {
    const response = await GET(new Request('http://localhost/api/health'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      status: 'Operational',
      auth: { type: 'public' },
      services: {},
      restricted: true,
    });
    expect(checkAllServicesHealth).not.toHaveBeenCalled();
  });

  it('登录态访问返回完整服务状态', async () => {
    (checkAllServicesHealth as jest.Mock).mockResolvedValue({
      supabase: {
        status: 'operational',
        stats: { auto_count: 1, manual_count: 2, failure_count: 0 },
      },
    });

    const response = await GET(
      new Request('http://localhost/api/health', {
        headers: { cookie: 'workflow_session=authenticated' },
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.services).toHaveProperty('supabase');
    expect(data.data.restricted).toBeUndefined();
  });
});
