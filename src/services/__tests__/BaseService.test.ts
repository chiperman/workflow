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

describe('BaseService.updateServiceStats', () => {
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
    // supabase.from().select().eq().single()
    // supabase.from().upsert().select().single()
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

  it('should create new record if none exists', async () => {
    // Mock no existing record (PGRST116 is "The result contains 0 rows")
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const result = await service.testUpdateServiceStats(true, 'auto');

    expect(result.ok).toBe(true);
    if (!result.ok) return; // Guard for TS

    expect(result.data.action).toBe('created');
    expect(result.data.data).toEqual({ manual_count: 0, auto_count: 1, failure_count: 0 });

    // Verify upsert
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'testservice', // lowercase
        auto_count: 1,
        manual_count: 0,
      })
    );
  });

  it('should update existing record and increment auto count', async () => {
    // Mock existing record
    mockSingle.mockResolvedValueOnce({
      data: { manual_count: 5, auto_count: 10, failure_count: 2, enabled: true },
      error: null,
    });

    const result = await service.testUpdateServiceStats(true, 'auto');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.action).toBe('updated');
    expect(result.data.data).toEqual({ manual_count: 5, auto_count: 11, failure_count: 2 });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'testservice',
        auto_count: 11,
        manual_count: 5,
        failure_count: 2,
      })
    );
  });

  it('should update existing record and increment manual count', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { manual_count: 5, auto_count: 10, failure_count: 0 },
      error: null,
    });

    const result = await service.testUpdateServiceStats(true, 'manual');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.data).toEqual({ manual_count: 6, auto_count: 10, failure_count: 0 });
  });

  it('should NOT increment counts if shouldIncrement is false', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { manual_count: 5, auto_count: 10, failure_count: 0 },
      error: null,
    });

    const result = await service.testUpdateServiceStats(false, 'auto');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.data).toEqual({ manual_count: 5, auto_count: 10, failure_count: 0 });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        auto_count: 10,
        manual_count: 5,
      })
    );
  });

  it('should throw error if table does not exist (42P01)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: '42P01', message: 'relation "keep_alive" does not exist' },
    });

    const result = await service.testUpdateServiceStats(true, 'auto');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Table 'keep_alive' does not exist. Please execute the SQL setup.");
  });

  it('should propagate other Supabase errors', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'SOME_OTHER_CODE', message: 'Something went wrong' },
    });

    const result = await service.testUpdateServiceStats(true, 'auto');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('Supabase select failed: Something went wrong');
  });
});
