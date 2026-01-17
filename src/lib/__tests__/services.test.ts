import { GladosService } from '../services/GladosService';
import { LeanCloudService } from '../services/LeanCloudService';
import { SupabaseService } from '../services/SupabaseService';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../bark', () => ({
  sendBarkNotification: jest.fn(),
}));

jest.mock('../env', () => ({
  env: {
    leancloud: {
      appId: 'test-id',
      appKey: 'test-key',
      serverUrl: 'https://test.api',
    },
    glados: {
      cookie: 'test-cookie',
      apiUrl: 'https://glados.rocks/api/user/checkin',
    },
  },
}));

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    service = new SupabaseService();
    jest.clearAllMocks();
  });

  it('应该能正确获取统计数据', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { auto_count: 1, manual_count: 2, failure_count: 0 },
            error: null,
          }),
        }),
      }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data).toEqual({ auto_count: 1, manual_count: 2, failure_count: 0 });
  });

  it('getStats 应正确处理表不存在错误', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: '42P01', message: 'Table does not exist' },
          }),
        }),
      }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(false);
    expect(stats.tableExists).toBe(false);
  });

  it('getStats 应正确处理记录不存在（PGRST116）', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        }),
      }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data).toEqual({ auto_count: 0, manual_count: 0, failure_count: 0 });
  });

  it('run (auto) 应该正确更新 auto_count', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { auto_count: 5, manual_count: 3, failure_count: 0 },
          error: null,
        }),
      }),
    });
    const mockUpsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { auto_count: 6, manual_count: 3, failure_count: 0 },
          error: null,
        }),
      }),
    });
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'keep_alive_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 0 }),
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
      return { select: mockSelect, upsert: mockUpsert };
    });

    const result = await service.run('auto');
    expect(result.success).toBe(true);
    expect(result.data?.auto_count).toBe(6);
  });

  it('run (manual) 应该正确更新 manual_count', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { auto_count: 5, manual_count: 3, failure_count: 0 },
          error: null,
        }),
      }),
    });
    const mockUpsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { auto_count: 5, manual_count: 4, failure_count: 0 },
          error: null,
        }),
      }),
    });
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'keep_alive_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 0 }),
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
      return { select: mockSelect, upsert: mockUpsert };
    });

    const result = await service.run('manual');
    expect(result.success).toBe(true);
    expect(result.data?.manual_count).toBe(4);
  });
});

describe('LeanCloudService', () => {
  let service: LeanCloudService;

  beforeEach(() => {
    service = new LeanCloudService();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('应该能正确获取统计数据', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ results: [{ auto_count: 3, manual_count: 4 }] }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data).toEqual({ auto_count: 3, manual_count: 4, failure_count: 0 });
  });

  it('getStats 应正确处理 404 错误（表不存在）', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.tableExists).toBe(false);
  });

  it('run (auto) 应该正确创建新记录', async () => {
    // 第一次 fetch: 查询返回空
    // 第二次 fetch: 创建成功
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ results: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ objectId: 'new-id' }),
      });

    // Mock supabase for logging
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'keep_alive_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 0 }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    const result = await service.run('auto');
    expect(result.success).toBe(true);
    expect(result.data?.auto_count).toBe(1);
  });

  it('run (manual) 应该正确更新现有记录', async () => {
    // 第一次 fetch: 查询返回已有记录
    // 第二次 fetch: 更新成功
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({
            results: [{ objectId: 'existing-id', auto_count: 5, manual_count: 3 }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ updatedAt: new Date().toISOString() }),
      });

    // Mock supabase for logging
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'keep_alive_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 0 }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });

    const result = await service.run('manual');
    expect(result.success).toBe(true);
    expect(result.data?.manual_count).toBe(4);
  });
});

describe('GladosService', () => {
  let service: GladosService;

  beforeEach(() => {
    service = new GladosService();
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('应该能正确获取统计数据', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { auto_count: 5, manual_count: 6, failure_count: 0 },
            error: null,
          }),
        }),
      }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data).toEqual({ auto_count: 5, manual_count: 6, failure_count: 0 });
  });

  it('应该能正确处理签到成功响应', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ code: 0, message: 'Checkin! Got 1 Points' }),
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'keep_alive_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({ count: 0 }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      // keep_alive table
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { auto_count: 1, manual_count: 2, failure_count: 0 },
              error: null,
            }),
          }),
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, auto_count: 2, manual_count: 2, failure_count: 0 },
              error: null,
            }),
          }),
        }),
      };
    });

    const result = await service.run('auto');
    expect(result.success).toBe(true);
  });
});
