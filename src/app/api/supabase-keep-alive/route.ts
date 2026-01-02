import { handleKeepAliveRequest } from '@/lib/api-helper';
import { supabaseService } from '@/lib/services/SupabaseService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleKeepAliveRequest(request, supabaseService);
}

export async function POST(request: Request) {
  return handleKeepAliveRequest(request, supabaseService);
}
