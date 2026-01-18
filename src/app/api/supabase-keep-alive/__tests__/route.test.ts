/**
 * @jest-environment node
 */
import { handleKeepAliveRequest } from '@/lib/api-helper';
import { supabaseService } from '@/lib/services/SupabaseService';
import { NextResponse } from 'next/server';
import { GET, POST } from '../route';

jest.mock('@/lib/api-helper');
jest.mock('@/lib/services/SupabaseService');

describe('Supabase Keep-Alive Route', () => {
  const mockRequest = new Request('http://localhost/api/supabase-keep-alive');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET handler calls handleKeepAliveRequest with supabaseService', async () => {
    (handleKeepAliveRequest as jest.Mock).mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    const response = await GET(mockRequest);

    expect(handleKeepAliveRequest).toHaveBeenCalledWith(mockRequest, supabaseService);
    expect(response.status).toBe(200);
  });

  it('POST handler calls handleKeepAliveRequest with supabaseService', async () => {
    (handleKeepAliveRequest as jest.Mock).mockResolvedValue(
      new NextResponse(null, { status: 200 })
    );

    const response = await POST(mockRequest);

    expect(handleKeepAliveRequest).toHaveBeenCalledWith(mockRequest, supabaseService);
    expect(response.status).toBe(200);
  });
});
