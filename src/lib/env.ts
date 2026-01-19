/**
 * 环境变量验证模块
 *
 * 在应用启动时验证所有必需的环境变量，提供类型安全的访问方式。
 * 如果缺少必需的环境变量，会抛出详细的错误消息。
 */

interface EnvConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  glados: {
    cookie: string;
    apiUrl?: string;
  };
  bark?: {
    deviceKey: string;
  };
  cron?: {
    secret: string;
  };
  appKey?: string;
}

/**
 * 验证并获取环境变量
 */
function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 必需的 Supabase 环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  // 必需的 GLaDOS 环境变量
  const gladosCookie = process.env.GLADOS_COOKIE;
  const gladosApiUrl = process.env.GLADOS_API_URL;

  if (!gladosCookie) missing.push('GLADOS_COOKIE');

  // 可选的 GLaDOS API URL（使用默认值）
  if (!gladosApiUrl) {
    warnings.push(
      'GLADOS_API_URL is not set. Using default: https://glados.cloud/api/user/checkin'
    );
  }

  // 可选的 Bark 环境变量
  const barkDeviceKey = process.env.BARK_DEVICE_KEY;
  if (!barkDeviceKey) {
    warnings.push('BARK_DEVICE_KEY is not set. Bark notifications will be disabled.');
  }

  // 可选的 Cron 安全密钥
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    warnings.push('CRON_SECRET is not set. Cron endpoints will not be protected.');
  }

  // 可选的应用访问密钥
  const appKey = process.env.APP_KEY;
  if (!appKey) {
    warnings.push('APP_KEY is not set. Dashboard operations will not be protected.');
  }

  // 如果有缺失的必需变量,抛出错误
  if (missing.length > 0) {
    const errorMessage = [
      '',
      '❌ Environment Variable Validation Failed',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Missing required environment variables:',
      ...missing.map(v => `  • ${v}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See env.example for reference.',
      '',
    ].join('\n');

    // 直接输出错误并退出,避免冗余的错误堆栈
    console.error(errorMessage);
    process.exit(1);
  }

  // 显示警告（如果有）
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('\n⚠️  Environment Variable Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }

  // 返回类型安全的环境变量对象
  return {
    supabase: {
      url: supabaseUrl!,
      serviceRoleKey: supabaseServiceRoleKey!,
    },
    glados: {
      cookie: gladosCookie!,
      apiUrl: gladosApiUrl,
    },
    ...(barkDeviceKey && {
      bark: {
        deviceKey: barkDeviceKey,
      },
    }),
    ...(cronSecret && {
      cron: {
        secret: cronSecret,
      },
    }),
    appKey,
  };
}

/**
 * 导出验证后的环境变量
 *
 * 使用方式:
 * ```typescript
 * import { env } from './env';
 *
 * const url = env.supabase.url;
 * ```
 */
export const env = validateEnv();
