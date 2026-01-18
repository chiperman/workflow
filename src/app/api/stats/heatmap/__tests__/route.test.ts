/**
 * @jest-environment node
 */
import { aggregateByDay } from '@/lib/heatmap-utils';
import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  },
}));

jest.mock('@/lib/heatmap-utils', () => ({
  aggregateByDay: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('Heatmap API Route', () => {
  const mockRequest = new NextRequest('http://localhost/api/stats/heatmap?year=2023');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET handler returns aggregated data on success', async () => {
    const mockData = [{ service: 'test', status: true, timestamp: '2023-01-01' }];
    const mockAggregated = { '2023-01-01': 10 };

    // Setup supabase chain mock
    const orderMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
    // @ts-expect-error - Mocking chained methods
    supabase.from().select().gte().lte().order = orderMock;

    (aggregateByDay as jest.Mock).mockReturnValue(mockAggregated);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAggregated);
    expect(data.year).toBe(2023);
  });

  it('GET handler defaults to current year if not provided', async () => {
    const req = new NextRequest('http://localhost/api/stats/heatmap');
    const orderMock = jest.fn().mockResolvedValue({ data: [], error: null });
    // @ts-expect-error - Mocking chained methods
    supabase.from().select().gte().lte().order = orderMock;

    const currentYear = new Date().getFullYear();
    const response = await GET(req);
    const data = await response.json();

    expect(data.year).toBe(currentYear);
  });

  it('GET handler returns 500 on supabase error', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
    // @ts-expect-error - Mocking chained methods
    supabase.from().select().gte().lte().order = orderMock;

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DB Error');
  });

  it('GET handler returns 500 on unexpected error', async () => {
    // Mock supabase to throw exception
    // @ts-expect-error - Mocking chained methods
    supabase.from().select.mockImplementation(() => {
      throw new Error('Unexpected');
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unexpected');
  });
});
