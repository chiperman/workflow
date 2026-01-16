import { checkLeanCloudHealth, checkSupabaseHealth } from '../health-check';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock env
jest.mock('../env', () => ({
  env: {
    leancloud: {
      appId: 'test-app-id',
      appKey: 'test-app-key',
      masterKey: 'test-master-key',
      serverUrl: 'https://test.leancloud.com',
    },
  },
}));

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
      message: 'Database setup required. Please execute the SQL setup.',
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
      message: 'Database setup required. Please execute the SQL setup.',
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
    });
  });
});

describe('checkLeanCloudHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('成功获取数据', async () => {
    const mockResponse = {
      results: [
        {
          objectId: '123',
          auto_count: 15,
          manual_count: 8,
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await checkLeanCloudHealth();

    expect(result).toEqual({
      status: 'operational',
      enabled: true,
      tableExists: true,
      stats: {
        auto_count: 15,
        manual_count: 8,
        failure_count: 0,
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.leancloud.com/1.1/classes/keep_alive?limit=1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-LC-Id': 'test-app-id',
          'X-LC-Key': 'test-master-key,master',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('类不存在 (404)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await checkLeanCloudHealth();

    expect(result).toEqual({
      status: 'misconfigured',
      enabled: true,
      tableExists: false,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
      message: 'Class "keep_alive" does not exist',
    });
  });

  it('API 错误 (非 404)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await checkLeanCloudHealth();

    expect(result.status).toBe('outage');
    expect(result.tableExists).toBe(false);
    expect(result.message).toContain('Query failed: 500');
  });

  it('空结果', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ results: [] }),
    });

    const result = await checkLeanCloudHealth();

    expect(result).toEqual({
      status: 'operational',
      enabled: true,
      tableExists: true,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
    });
  });

  it('网络错误', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

    const result = await checkLeanCloudHealth();

    expect(result).toEqual({
      status: 'outage',
      tableExists: false,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
      message: 'Network timeout',
    });
  });

  it('数据字段缺失时使用默认值', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        results: [{ objectId: '123' }], // 缺少计数字段
      }),
    });

    const result = await checkLeanCloudHealth();

    expect(result).toEqual({
      status: 'operational',
      enabled: true,
      tableExists: true,
      stats: {
        auto_count: 0,
        manual_count: 0,
        failure_count: 0,
      },
    });
  });

  it('JSON 解析错误', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    });

    const result = await checkLeanCloudHealth();

    expect(result.status).toBe('outage');
    expect(result.message).toBe('Invalid JSON');
  });
});
