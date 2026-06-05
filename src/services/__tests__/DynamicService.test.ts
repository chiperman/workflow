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
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
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
    config: { urls: ['https://api1.com', 'https://api2.com'], method: 'GET' },
    secret_config: { headers: {} },
    rules: { success: { status: 200 } },
    manual_count: 0,
    auto_count: 0,
    failure_count: 0,
    timestamp: '',
    created_at: new Date().toISOString(),
  };

  const checkinConfig: ServiceConfig = {
    service: 'daily-checkin',
    name: '通用签到',
    type: 'http',
    enabled: true,
    notification_level: 'none',
    config: {
      urls: ['https://checkin.example.com/api/user/checkin'],
      method: 'POST',
      success_message_template: '{{service}} 签到成功，获得 {{points}} 积分 [{{time}}]',
      repeat_message_template: '{{service}} 今日已签到，{{message}}',
    },
    secret_config: {
      headers: { 'Content-Type': 'application/json' },
    },
    rules: {
      success: {
        status: 200,
        json: [{ path: 'code', operator: 'in', value: [0, 1] }],
      },
      increment: {
        json: [{ path: 'code', operator: 'eq', value: 0 }],
      },
    },
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

    it('should render configured success template for check-in services', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          code: 0,
          points: 14,
          message: 'Checkin! Got 14 Points',
        }),
      });

      const service = new DynamicService(checkinConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(result.message).toContain('通用签到');
      expect(result.message).toContain('签到成功，获得 14 积分');
      expect(result.skipLog).toBe(false);
    });

    it('should render configured repeat template when check-in was already completed', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          code: 1,
          points: 0,
          message: "Today's observation logged. Return tomorrow for more points.",
        }),
      });

      const service = new DynamicService(checkinConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(result.message).toContain('通用签到 今日已签到');
      expect(result.message).toContain("Today's observation logged.");
      expect(result.skipLog).toBe(true);
    });

    it('should support nested JSON paths in success message templates', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({
          code: 0,
          data: { reward: 9 },
          message: 'Checkin! Got 9 Points',
        }),
      });

      const service = new DynamicService({
        ...checkinConfig,
        config: {
          ...checkinConfig.config,
          success_message_template: '{{service}} 签到成功，获得 {{data.reward}} 积分',
        },
      });
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(result.message).toContain('签到成功，获得 9 积分');
    });
  });

  describe('Supabase Internal Modes', () => {
    it('should execute local mode when URL is missing', async () => {
      const localConfig = {
        ...httpConfig,
        type: 'supabase_internal',
        config: {},
        secret_config: {},
      } as ServiceConfig;
      const service = new DynamicService(localConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(result.message).toContain('本地保活触发');
    });

    it('should handle remote failure correctly', async () => {
      const remoteConfig = {
        ...httpConfig,
        type: 'supabase_internal',
        config: { supabase_url: 'https://err.co' },
        secret_config: { supabase_key: 'k' },
      } as ServiceConfig;

      const createClientSpy = jest.spyOn(supabaseJs, 'createClient');
      createClientSpy.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          upsert: jest
            .fn()
            .mockResolvedValue({ data: null, error: { message: 'Table not found' } }),
        }),
      } as unknown as ReturnType<typeof supabaseJs.createClient>);

      const service = new DynamicService(remoteConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Remote Supabase heart-beat write failed');
      createClientSpy.mockRestore();
    });

    it('should write heartbeat, read it back, and probe configured table', async () => {
      const remoteConfig = {
        ...httpConfig,
        type: 'supabase_internal',
        config: {
          supabase_url: 'https://project.supabase.co',
          table_name: 'keep_alive',
          probe_table: 'memos',
        },
        secret_config: { supabase_key: 'k' },
      } as ServiceConfig;

      const upsert = jest.fn().mockResolvedValue({ data: null, error: null });
      const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const limit = jest.fn().mockResolvedValue({ data: [], error: null });
      const from = jest.fn((table: string) => ({
        upsert,
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ maybeSingle })),
          limit,
        })),
        table,
      }));
      const createClientSpy = jest.spyOn(supabaseJs, 'createClient');
      createClientSpy.mockReturnValueOnce({
        from,
      } as unknown as ReturnType<typeof supabaseJs.createClient>);

      const service = new DynamicService(remoteConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(true);
      expect(from).toHaveBeenCalledWith('keep_alive');
      expect(from).toHaveBeenCalledWith('memos');
      expect(upsert).toHaveBeenCalledTimes(1);
      expect(maybeSingle).toHaveBeenCalledTimes(1);
      expect(limit).toHaveBeenCalledWith(1);
      createClientSpy.mockRestore();
    });

    it('should report probe table failures separately', async () => {
      const remoteConfig = {
        ...httpConfig,
        type: 'supabase_internal',
        config: {
          supabase_url: 'https://project.supabase.co',
          probe_table: 'memos',
        },
        secret_config: { supabase_key: 'k' },
      } as ServiceConfig;

      const from = jest.fn((table: string) => ({
        upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: table === 'memos' ? 'permission denied' : 'unexpected' },
          }),
        })),
      }));
      const createClientSpy = jest.spyOn(supabaseJs, 'createClient');
      createClientSpy.mockReturnValueOnce({
        from,
      } as unknown as ReturnType<typeof supabaseJs.createClient>);

      const service = new DynamicService(remoteConfig);
      const result = await service.testExecution();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Remote Supabase probe table "memos" failed');
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
