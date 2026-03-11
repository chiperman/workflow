import { checkSupabaseHealth, checkServiceHealth } from '../health-check';
import { ServiceFactory } from '@/services/ServiceFactory';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            count: 0,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// Mock ServiceFactory
jest.mock('@/services/ServiceFactory');

describe('health-check logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkServiceHealth', () => {
    it('当服务配置不存在时应返回 misconfigured', async () => {
      (ServiceFactory.getService as jest.Mock).mockResolvedValue(null);

      const result = await checkServiceHealth('unknown-service');

      expect(result.status).toBe('misconfigured');
      expect(result.message).toContain('not found');
    });

    it('成功获取服务状态时应返回 operational', async () => {
      const mockStats = {
        ok: true,
        data: {
          enabled: true,
          tableExists: true,
          auto_count: 10,
          manual_count: 5,
          failure_count: 0,
        },
      };

      const mockService = {
        getStats: jest.fn().mockResolvedValue(mockStats),
        displayName: 'Mock Service',
        type: 'http',
        description: 'Test',
        category: 'Test Category',
      };

      (ServiceFactory.getService as jest.Mock).mockResolvedValue(mockService);

      const result = await checkServiceHealth('mock-service');

      expect(result).toEqual({
        status: 'operational',
        enabled: true,
        tableExists: true,
        stats: {
          auto_count: 10,
          manual_count: 5,
          failure_count: 0,
        },
        todayCheckedIn: false,
        name: 'Mock Service',
        type: 'http',
        description: 'Test',
        category: 'Test Category',
      });
    });

    it('服务 getStats 失败时应返回错误信息', async () => {
      const mockStats = {
        ok: false,
        error: 'Database connection failed',
      };

      const mockService = {
        getStats: jest.fn().mockResolvedValue(mockStats),
      };

      (ServiceFactory.getService as jest.Mock).mockResolvedValue(mockService);

      const result = await checkServiceHealth('mock-service');

      expect(result.status).toBe('misconfigured');
      expect(result.message).toBe('Database connection failed');
    });
  });

  describe('checkSupabaseHealth (compatibility)', () => {
    it('应调用通用的 checkServiceHealth', async () => {
      const mockStats = {
        ok: true,
        data: {
          enabled: true,
          tableExists: true,
          auto_count: 0,
          manual_count: 0,
          failure_count: 0,
        },
      };

      const mockService = {
        getStats: jest.fn().mockResolvedValue(mockStats),
        displayName: 'Supabase',
      };

      (ServiceFactory.getService as jest.Mock).mockResolvedValue(mockService);

      const result = await checkSupabaseHealth();
      expect(ServiceFactory.getService).toHaveBeenCalledWith('supabase');
      expect(result.status).toBe('operational');
    });
  });
});
