/**
 * API Helper 测试
 *
 * 这个模块测试 handleKeepAliveRequest 函数的各种场景
 */

// Mock supabase client FIRST to prevent import errors
jest.mock('../supabase', () => ({
  supabase: { from: jest.fn() },
}));

// Mock bark
jest.mock('../bark', () => ({
  sendBarkNotification: jest.fn(),
}));

// Mock Next.js Response
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
      headers: options?.headers || {},
    })),
  },
}));

// Mock env
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    CRON_SECRET: 'test-cron-secret',
    APP_KEY: 'test-app-key',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

import type { KeepAliveResult, StatsQueryResult } from '@/types';
import { handleKeepAliveRequest } from '../api-helper';
import { BaseService } from '../services/BaseService';

// Mock BaseService implementation for testing
class MockService extends BaseService {
  public mockRunResult: KeepAliveResult = {
    success: true,
    message: 'Mock success',
    duration: 100,
    data: { auto_count: 1, manual_count: 2, failure_count: 0 },
  };

  public mockStatsResult: StatsQueryResult = {
    success: true,
    data: { auto_count: 1, manual_count: 2, failure_count: 0 },
    tableExists: true,
    enabled: true,
  };

  constructor() {
    super('MockService');
  }

  protected async executeKeepAlive(): Promise<KeepAliveResult> {
    return this.mockRunResult;
  }

  public async getStats(): Promise<StatsQueryResult> {
    return this.mockStatsResult;
  }

  public async run(): Promise<KeepAliveResult> {
    return this.mockRunResult;
  }
}

// Helper function to create mock Request
function createMockRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {}
) {
  return {
    url,
    method: options.method || 'GET',
    headers: {
      get: (name: string) => {
        const headerName = name.toLowerCase();
        const headers = options.headers || {};
        for (const key in headers) {
          if (key.toLowerCase() === headerName) {
            return headers[key];
          }
        }
        return null;
      },
    },
  } as unknown as Request;
}

describe('handleKeepAliveRequest', () => {
  let mockService: MockService;

  beforeEach(() => {
    mockService = new MockService();
    jest.clearAllMocks();
  });

  describe('mode=status', () => {
    it('应允许匿名访问 status 模式', async () => {
      const request = createMockRequest('https://test.com/api/test?mode=status');
      const response = await handleKeepAliveRequest(request, mockService);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ auto_count: 1, manual_count: 2, failure_count: 0 });
    });
  });

  describe('auto trigger (GET)', () => {
    it('应拒绝未授权的 auto 请求', async () => {
      const request = createMockRequest('https://test.com/api/test', { method: 'GET' });
      const response = await handleKeepAliveRequest(request, mockService);

      expect(response.status).toBe(401);
    });

    it('应接受正确的 cron secret', async () => {
      const request = createMockRequest('https://test.com/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-cron-secret' },
      });

      const response = await handleKeepAliveRequest(request, mockService);
      expect(response.status).toBe(200);
    });
  });

  describe('manual trigger (POST)', () => {
    it('应拒绝未授权的 manual 请求', async () => {
      const request = createMockRequest('https://test.com/api/test', { method: 'POST' });
      const response = await handleKeepAliveRequest(request, mockService);

      expect(response.status).toBe(401);
    });

    it('应接受正确的 app key', async () => {
      const request = createMockRequest('https://test.com/api/test', {
        method: 'POST',
        headers: { 'X-App-Key': 'test-app-key' },
      });

      const response = await handleKeepAliveRequest(request, mockService);
      expect(response.status).toBe(200);
    });

    it('应接受有效的 session cookie', async () => {
      const request = createMockRequest('https://test.com/api/test', {
        method: 'POST',
        headers: { Cookie: 'workflow_session=authenticated' },
      });

      const response = await handleKeepAliveRequest(request, mockService);
      expect(response.status).toBe(200);
    });
  });

  describe('error handling', () => {
    it('应返回 500 当服务执行失败', async () => {
      mockService.mockRunResult = { success: false, message: 'Failed', duration: 0 };

      const request = createMockRequest('https://test.com/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-cron-secret' },
      });

      const response = await handleKeepAliveRequest(request, mockService);
      expect(response.status).toBe(500);
    });
  });
});
