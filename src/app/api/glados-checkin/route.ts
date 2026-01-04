import { handleKeepAliveRequest } from '@/lib/api-helper';
import { gladosService } from '@/lib/services/GladosService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleKeepAliveRequest(request, gladosService);
}

export async function POST(request: Request) {
  return handleKeepAliveRequest(request, gladosService);
}
