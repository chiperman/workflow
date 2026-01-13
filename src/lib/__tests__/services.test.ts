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
            data: { auto_count: 1, manual_count: 2 },
            error: null,
          }),
        }),
      }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data).toEqual({ auto_count: 1, manual_count: 2 });
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
    expect(stats.data).toEqual({ auto_count: 3, manual_count: 4 });
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
            data: { auto_count: 5, manual_count: 6 },
            error: null,
          }),
        }),
      }),
    });

    const stats = await service.getStats();
    expect(stats.success).toBe(true);
    expect(stats.data).toEqual({ auto_count: 5, manual_count: 6 });
  });

  it('应该能正确处理签到成功响应', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ code: 0, message: 'Checkin! Got 1 Points' }),
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { auto_count: 1, manual_count: 2 },
            error: null,
          }),
        }),
      }),
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 1, auto_count: 2, manual_count: 2 },
            error: null,
          }),
        }),
      }),
    });

    const result = await service.run('auto');
    expect(result.success).toBe(true);
  });
});
