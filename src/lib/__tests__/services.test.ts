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
