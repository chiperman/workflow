/**
 * @jest-environment node
 */
import { handleKeepAliveRequest } from '@/lib/api-helper';
import { gladosService } from '@/lib/services/GladosService';
import { NextResponse } from 'next/server';
import { GET, POST } from '../route';

jest.mock('@/lib/api-helper');
jest.mock('@/lib/services/GladosService');

describe('GLaDOS Check-In Route', () => {
  const mockRequest = new Request('http://localhost/api/glados-checkin');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET handler calls handleKeepAliveRequest with gladosService', async () => {
    (handleKeepAliveRequest as jest.Mock).mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    const response = await GET(mockRequest);

    expect(handleKeepAliveRequest).toHaveBeenCalledWith(mockRequest, gladosService);
    expect(response.status).toBe(200);
  });

  it('POST handler calls handleKeepAliveRequest with gladosService', async () => {
    (handleKeepAliveRequest as jest.Mock).mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    const response = await POST(mockRequest);

    expect(handleKeepAliveRequest).toHaveBeenCalledWith(mockRequest, gladosService);
    expect(response.status).toBe(200);
  });
});
