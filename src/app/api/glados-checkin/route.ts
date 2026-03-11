import { handleKeepAliveRequest } from '@/lib/api-helper';
import { ServiceFactory } from '@/lib/services/ServiceFactory';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const service = await ServiceFactory.getService('glados');
  if (!service) {
    return NextResponse.json(
      { success: false, message: 'GLaDOS service config not found' },
      { status: 404 }
    );
  }
  return handleKeepAliveRequest(request, service);
}

export async function POST(request: Request) {
  const service = await ServiceFactory.getService('glados');
  if (!service) {
    return NextResponse.json(
      { success: false, message: 'GLaDOS service config not found' },
      { status: 404 }
    );
  }
  return handleKeepAliveRequest(request, service);
}
