import { DynamicService } from '../DynamicService';
import type { ServiceConfig } from '@/types';
import * as supabaseJs from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('DynamicService Robustness Tests', () => {
  let mockUpdateStats: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use an interface that includes the methods we need to mock
    interface DynamicServiceWithStats {
      updateServiceStats: (
        shouldIncrement: boolean,
        trigger: string
      ) => Promise<{ ok: boolean; data: unknown }>;
    }

    mockUpdateStats = jest.spyOn(
      DynamicService.prototype as unknown as DynamicServiceWithStats,
      'updateServiceStats'
    );
    mockUpdateStats.mockResolvedValue({
      ok: true,
      data: { action: 'updated', data: { manual_count: 1, auto_count: 1, failure_count: 0 } },
    });
  });

  afterEach(() => {
    mockUpdateStats.mockRestore();
  });

  const httpConfig: ServiceConfig = {
    service: 'test-http',
    name: 'Test HTTP',
    type: 'http',
    enabled: true,
    notification_level: 'none',
    config: { urls: ['https://api1.com', 'https://api2.com'], method: 'GET', headers: {} },
    rules: { success: { status: 200 } },
    manual_count: 0,
    auto_count: 0,
    failure_count: 0,
    timestamp: '',
    created_at: new Date().toISOString(),
  };

  describe('HTTP Multi-URL & Failure Handling', () => {
    it('should try second URL if first one fails', async () => {
      // First call fails, second succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ code: 0 }),
        });

      const service = new DynamicService(httpConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.message).toContain('Test HTTP 成功');
    });

    it('should fail if all URLs fail', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const service = new DynamicService(httpConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail if response status does not match rules', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        headers: new Map(),
        text: async () => 'Not Found',
      });

      const service = new DynamicService(httpConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed. Status: 404');
    });
  });

  describe('Supabase Internal Modes', () => {
    it('should execute local mode when URL is missing', async () => {
      const localConfig = { ...httpConfig, type: 'supabase_internal', config: {} } as ServiceConfig;
      const service = new DynamicService(localConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(result.message).toContain('本地保活触发');
    });

    it('should handle remote failure correctly', async () => {
      const remoteConfig = {
        ...httpConfig,
        type: 'supabase_internal',
        config: { supabase_url: 'https://err.co', supabase_key: 'k' },
      } as ServiceConfig;

      const createClientSpy = jest.spyOn(supabaseJs, 'createClient');
      createClientSpy.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue({ data: null, error: { message: 'Table not found' } }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseJs.createClient>);

      const service = new DynamicService(remoteConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Remote Supabase check failed');
      createClientSpy.mockRestore();
    });
  });

  describe('Side-effect Isolation (Final Check)', () => {
    it('testExecution must NEVER call updateServiceStats', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        headers: new Map(),
        text: async () => 'OK',
      });

      const service = new DynamicService(httpConfig);
      await service.testExecution();

      expect(mockUpdateStats).not.toHaveBeenCalled();
    });

    it('executeKeepAlive MUST call updateServiceStats on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        headers: new Map(),
        text: async () => 'OK',
      });

      const service = new DynamicService(httpConfig);
      // @ts-expect-error - Testing internal execution logic to verify correct statistical accumulation
      await service.executeKeepAlive('auto');

      expect(mockUpdateStats).toHaveBeenCalledWith(true, 'auto');
    });
  });
});
