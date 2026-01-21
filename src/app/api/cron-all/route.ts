import { env } from '@/lib/env';
import { gladosService } from '@/lib/services/GladosService';
import { supabaseService } from '@/lib/services/SupabaseService';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 统一 cron job 端点
 * 并行执行所有服务的保活任务（受 enabled 状态控制）
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  // 验证 cron secret
  if (env.cron?.secret) {
    if (authHeader !== `Bearer ${env.cron.secret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized (Cron)' }, { status: 401 });
    }
  }

  // 并行执行所有服务（开关检查已由 ServiceExecutor 处理）
  const [supabaseResult, gladosResult] = await Promise.all([
    supabaseService.run('auto'),
    gladosService.run('auto'),
  ]);

  // 构建响应
  const results = {
    supabase: supabaseResult,
    glados: gladosResult,
  };

  // 整体状态：只要有一个成功就返回 200
  const hasSuccess = supabaseResult.success || gladosResult.success;
  const status = hasSuccess ? 200 : 500;

  return NextResponse.json(results, { status });
}
