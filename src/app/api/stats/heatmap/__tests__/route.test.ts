/**
 * @jest-environment node
 */
import { getHeatmapData } from '@/services/heatmap-data';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies
jest.mock('@/services/heatmap-data', () => ({
  getHeatmapData: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn().mockReturnValue({ authorized: true, type: 'session' }),
}));

describe('Heatmap API Route', () => {
  const mockRequest = new NextRequest('http://localhost/api/stats/heatmap?year=2023');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET handler returns aggregated data on success', async () => {
    const mockAggregated = {
      heatmap: [{ date: '2023-01-01', success_count: 1, failure_count: 0, services: {} }],
      services: ['test-service'],
    };
    (getHeatmapData as jest.Mock).mockResolvedValue(mockAggregated);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAggregated);
  });

  it('GET handler defaults to current year if not provided', async () => {
    const req = new NextRequest('http://localhost/api/stats/heatmap');
    (getHeatmapData as jest.Mock).mockResolvedValue({ heatmap: [], services: [] });

    const currentYear = new Date().getFullYear();
    await GET(req);

    expect(getHeatmapData).toHaveBeenCalledWith(currentYear);
  });

  it('GET handler returns 500 on database error', async () => {
    (getHeatmapData as jest.Mock).mockRejectedValue(new Error('DB Error'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DB Error');
  });
});
