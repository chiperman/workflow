/**
 * @jest-environment node
 */
import { checkTriggerPermission, verifyAuth } from '@/lib/auth';
import { KeepAliveResult } from '@/types';
import { handleKeepAliveRequest } from '../api-helper';
import { BaseService } from '../services/BaseService';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  checkTriggerPermission: jest.fn(),
  verifyAuth: jest.fn(),
}));

// Mock BaseService
class MockService extends BaseService {
  constructor() {
    super('mock-service');
  }
  // Implement abstract method
  async executeKeepAlive(_trigger: 'auto' | 'manual'): Promise<KeepAliveResult> {
    return {
      success: true,
      message: 'Mock execution',
      duration: 0,
      action: 'created',
      data: { manual_count: 0, auto_count: 0, failure_count: 0 },
    };
  }
}

describe('handleKeepAliveRequest', () => {
  let mockService: MockService;
  let runSpy: jest.SpyInstance;
  let getStatsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = new MockService();

    runSpy = jest.spyOn(mockService, 'run').mockResolvedValue({
      success: true,
      message: 'Success',
      duration: 123,
    });

    getStatsSpy = jest.spyOn(mockService, 'getStats');
  });

  const createRequest = (method: string = 'GET', searchParams: Record<string, string> = {}) => {
    const url = new URL('http://localhost/api/test');
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
    return new Request(url.toString(), { method });
  };

  it('should allow access when mode is status with valid auth', async () => {
    const req = createRequest('GET', { mode: 'status' });
    const mockStats = {
      ok: true,
      data: {
        manual_count: 10,
        auto_count: 5,
        failure_count: 0,
        tableExists: true,
        enabled: true, // Mock data includes enabled
      },
    };
    (verifyAuth as jest.Mock).mockReturnValue({ authorized: true, type: 'session' });
    getStatsSpy.mockResolvedValue(mockStats);

    const response = await handleKeepAliveRequest(req, mockService);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      manual_count: 10,
      auto_count: 5,
      failure_count: 0,
      tableExists: true,
      enabled: true,
    });
    expect(verifyAuth).toHaveBeenCalled();
  });

  it('should return 401 if authentication fails', async () => {
    const req = createRequest('POST', { trigger: 'manual' });
    (verifyAuth as jest.Mock).mockReturnValue({ authorized: false, message: 'Unauthorized' });

    const response = await handleKeepAliveRequest(req, mockService);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Unauthorized');
  });

  it('should return 401 if authorization (permission) fails', async () => {
    const req = createRequest('POST', { trigger: 'manual' });
    (verifyAuth as jest.Mock).mockReturnValue({ authorized: true, type: 'admin' });
    (checkTriggerPermission as jest.Mock).mockReturnValue({
      ok: false,
      error: 'Forbidden',
    });

    const response = await handleKeepAliveRequest(req, mockService);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Forbidden');
  });

  it('should execute service run if auth passes', async () => {
    const req = createRequest('POST', { trigger: 'manual' });
    (verifyAuth as jest.Mock).mockReturnValue({ authorized: true, type: 'admin' });
    (checkTriggerPermission as jest.Mock).mockReturnValue({ ok: true });

    const response = await handleKeepAliveRequest(req, mockService);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockService.run).toHaveBeenCalledWith('manual');
  });

  it('should return 500 if service run returns failure', async () => {
    const req = createRequest('GET'); // default auto
    (verifyAuth as jest.Mock).mockReturnValue({ authorized: true, type: 'cron' });
    (checkTriggerPermission as jest.Mock).mockReturnValue({ ok: true });

    runSpy.mockResolvedValue({ success: false, message: 'Service failed', duration: 100 });

    const response = await handleKeepAliveRequest(req, mockService);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Service failed');
  });

  it('should return 500 if service throws exception', async () => {
    const req = createRequest('GET');
    (verifyAuth as jest.Mock).mockReturnValue({ authorized: true, type: 'cron' });
    (checkTriggerPermission as jest.Mock).mockReturnValue({ ok: true });

    runSpy.mockRejectedValue(new Error('Critical error'));

    const response = await handleKeepAliveRequest(req, mockService);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Critical error');
  });
});
