import { handleKeepAliveRequest } from '@/lib/api-helper';
import { ServiceFactory } from '@/lib/services/ServiceFactory';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await ServiceFactory.getService(id);

  if (!service) {
    return NextResponse.json(
      { success: false, message: `Service ${id} not found` },
      { status: 404 }
    );
  }

  return handleKeepAliveRequest(request, service);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await ServiceFactory.getService(id);

  if (!service) {
    return NextResponse.json(
      { success: false, message: `Service ${id} not found` },
      { status: 404 }
    );
  }

  return handleKeepAliveRequest(request, service);
}
