import { BaseService } from '@/services/BaseService';
import { supabase } from '@/lib/supabase';
import { KeepAliveResult } from '@/types';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Concrete implementation for testing abstract class
class TestService extends BaseService {
  constructor() {
    super('TestService');
  }

  // Implementation required by abstract class
  protected async executeKeepAlive(_trigger: 'auto' | 'manual'): Promise<KeepAliveResult> {
    return { success: true, message: 'OK', duration: 0 }; // Not used in these tests
  }

  // Expose protected method for testing
  public async testUpdateServiceStats(shouldIncrement: boolean, trigger: 'auto' | 'manual') {
    return this.updateServiceStats(shouldIncrement, trigger);
  }
}

describe('BaseService.updateServiceStats (Refactored)', () => {
  let service: TestService;
  const mockFrom = supabase.from as jest.Mock;
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockSingle = jest.fn();
  const mockUpsert = jest.fn();

  beforeEach(() => {
    service = new TestService();
    jest.clearAllMocks();

    // Setup chainable mock
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });
    mockUpsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    });
  });

  it('should create new record in service_stats if none exists', async () => {
    // Mock no existing record in service_stats
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const result = await service.testUpdateServiceStats(true, 'auto');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.action).toBe('created');
    expect(result.data.data).toEqual({ manual_count: 0, auto_count: 1, failure_count: 0 });

    // Verify upsert target
    expect(mockFrom).toHaveBeenCalledWith('service_stats');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'testservice',
        auto_count: 1,
        manual_count: 0,
      })
    );
  });

  it('should update existing record in service_stats', async () => {
    // Mock existing record
    mockSingle.mockResolvedValueOnce({
      data: { manual_count: 5, auto_count: 10, failure_count: 2 },
      error: null,
    });

    const result = await service.testUpdateServiceStats(true, 'auto');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.action).toBe('updated');
    expect(result.data.data).toEqual({ manual_count: 5, auto_count: 11, failure_count: 2 });

    expect(mockFrom).toHaveBeenCalledWith('service_stats');
  });

  it('should throw error if service_stats table does not exist', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42P01', message: 'relation "service_stats" does not exist' },
    });

    const result = await service.testUpdateServiceStats(true, 'auto');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe(
      "Table 'service_stats' does not exist. Please execute the SQL setup."
    );
  });
});
