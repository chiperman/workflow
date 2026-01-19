import { checkSupabaseHealth } from '../health-check';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock env

import { supabase } from '../supabase';

describe('checkSupabaseHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('成功获取数据', async () => {
    const mockData = {
      id: 1,
      auto_count: 10,
      manual_count: 5,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    });

    const result = await checkSupabaseHealth();

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
    });
  });

  it('表存在但无数据 (PGRST116)', async () => {
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

    const result = await checkSupabaseHealth();

    expect(result).toEqual({
      status: 'operational',
      enabled: true,
      tableExists: true,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
      todayCheckedIn: false,
    });
  });

  it('表不存在 (42P01)', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42P01',
              message: 'relation "keep_alive" does not exist',
            },
          }),
        }),
      }),
    });

    const result = await checkSupabaseHealth();

    expect(result).toEqual({
      status: 'misconfigured',
      tableExists: false,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
      message: "Table 'keep_alive' does not exist",
      todayCheckedIn: false,
    });
  });

  it('其他数据库错误', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'SOME_ERROR',
              message: 'Database error',
            },
          }),
        }),
      }),
    });

    const result = await checkSupabaseHealth();

    expect(result.status).toBe('misconfigured');
    expect(result.tableExists).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('网络错误', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Network error')),
        }),
      }),
    });

    const result = await checkSupabaseHealth();

    expect(result).toEqual({
      status: 'misconfigured', // 网络错误导致无法连接表，也被视为配置问题或初始状态
      tableExists: false,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
      message: 'Network error',
      todayCheckedIn: false,
    });
  });

  it('数据字段缺失时使用默认值', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 1 }, // 缺少 auto_count 和 manual_count
            error: null,
          }),
        }),
      }),
    });

    const result = await checkSupabaseHealth();

    expect(result).toEqual({
      status: 'operational',
      enabled: true,
      tableExists: true,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
      todayCheckedIn: false,
    });
  });
});
