import { SERVICES } from '@/config/constants';
import { env } from '@/lib/env';
import { gladosService } from '@/lib/services/GladosService';
import { leanCloudService } from '@/lib/services/LeanCloudService';
import { supabaseService } from '@/lib/services/SupabaseService';
import { supabase } from '@/lib/supabase';
import type { KeepAliveResult } from '@/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ServiceConfig {
  service: string;
  enabled: boolean;
}

async function getServiceConfigs(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('keep_alive').select('service, enabled');

  if (error || !data) {
    // 默认所有服务开启
    return {
      [SERVICES.SUPABASE]: true,
      [SERVICES.LEANCLOUD]: true,
      [SERVICES.GLADOS]: true,
    };
  }

  const configs: Record<string, boolean> = {
    [SERVICES.SUPABASE]: true,
    [SERVICES.LEANCLOUD]: true,
    [SERVICES.GLADOS]: true,
  };
  data.forEach((row: ServiceConfig) => {
    configs[row.service] = row.enabled ?? true;
  });
  return configs;
}

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

  // 获取服务配置
  const configs = await getServiceConfigs();

  // 定义服务执行器
  const executeIfEnabled = async (
    serviceName: string,
    runner: () => Promise<KeepAliveResult>
  ): Promise<KeepAliveResult> => {
    if (!configs[serviceName]) {
      return {
        success: true,
        message: 'Skipped: service disabled',
        duration: 0,
        skipped: true,
      } as KeepAliveResult & { skipped: boolean };
    }
    return runner();
  };

  // 并行执行所有服务
  const [supabaseResult, leancloudResult, gladosResult] = await Promise.all([
    executeIfEnabled(SERVICES.SUPABASE, () => supabaseService.run('auto')),
    executeIfEnabled(SERVICES.LEANCLOUD, () => leanCloudService.run('auto')),
    executeIfEnabled(SERVICES.GLADOS, () => gladosService.run('auto')),
  ]);

  // 构建响应
  const results = {
    supabase: supabaseResult,
    leancloud: leancloudResult,
    glados: gladosResult,
  };

  // 整体状态：只要有一个成功就返回 200
  const hasSuccess = supabaseResult.success || leancloudResult.success || gladosResult.success;
  const status = hasSuccess ? 200 : 500;

  return NextResponse.json(results, { status });
}
