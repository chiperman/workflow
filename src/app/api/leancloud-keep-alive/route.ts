import { handleKeepAliveRequest } from '@/lib/api-helper';
import { leanCloudService } from '@/lib/services/LeanCloudService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleKeepAliveRequest(request, leanCloudService);
}

export async function POST(request: Request) {
  return handleKeepAliveRequest(request, leanCloudService);
}
