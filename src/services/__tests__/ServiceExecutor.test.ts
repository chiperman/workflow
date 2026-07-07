import { supabase } from '@/lib/supabase';
import { BaseService } from '@/services/BaseService';
import { ServiceExecutor } from '@/services/ServiceExecutor';
import type { KeepAliveResult } from '@/types';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/bark', () => ({
  sendBarkNotification: jest.fn(),
}));

class TestService extends BaseService {
  public executeSpy = jest.fn();

  constructor() {
    super('test-service');
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual'): Promise<KeepAliveResult> {
    this.executeSpy(trigger);
    return { success: true, message: 'OK', duration: 0 };
  }
}

function mockEnabledLookup(result: { data: { enabled?: boolean } | null; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  (supabase.from as jest.Mock).mockReturnValue({ select });
}

describe('ServiceExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('服务开关查询失败时不执行任务', async () => {
    mockEnabledLookup({
      data: null,
      error: { code: 'PGRST000', message: 'connection failed' },
    });

    const service = new TestService();
    const result = await ServiceExecutor.runService(service, 'auto');

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(service.executeSpy).not.toHaveBeenCalled();
  });

  it('服务配置不存在时保持默认启用兼容行为', async () => {
    mockEnabledLookup({
      data: null,
      error: { code: 'PGRST116', message: 'no rows found' },
    });

    const service = new TestService();
    const result = await ServiceExecutor.runService(service, 'manual');

    expect(result.success).toBe(true);
    expect(service.executeSpy).toHaveBeenCalledWith('manual');
  });
});
