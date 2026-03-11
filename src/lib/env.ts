/**
 * 环境变量验证模块
 *
 * 在应用启动时验证所有必需的环境变量，提供类型安全的访问方式。
 * 仅在服务端环境下执行强制校验并可能退出进程。
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
  const isServer = typeof window === 'undefined';
  const missing: string[] = [];
  const warnings: string[] = [];

  // 读取环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gladosCookie = process.env.GLADOS_COOKIE;
  const gladosApiUrl = process.env.GLADOS_API_URL;
  const barkDeviceKey = process.env.BARK_DEVICE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const appKey = process.env.APP_KEY;

  // 仅在服务端执行必需项校验
  if (isServer) {
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!gladosCookie) missing.push('GLADOS_COOKIE');

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
        '',
      ].join('\n');

      console.error(errorMessage);
      // 只有在真正的 Node.js 环境下才调用 exit
      if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
      }
    }

    // 警告信息 (仅开发环境服务端显示)
    if (process.env.NODE_ENV === 'development') {
      if (!barkDeviceKey) warnings.push('BARK_DEVICE_KEY is not set.');
      if (!cronSecret) warnings.push('CRON_SECRET is not set.');
      if (!appKey) warnings.push('APP_KEY is not set.');

      if (warnings.length > 0) {
        console.warn('⚠️  Env Warnings:', warnings.join(' '));
      }
    }
  }

  // 返回环境变量对象 (客户端只会看到 NEXT_PUBLIC_ 开头的变量)
  return {
    supabase: {
      url: supabaseUrl || '',
      serviceRoleKey: supabaseServiceRoleKey || '',
    },
    glados: {
      cookie: gladosCookie || '',
      apiUrl: gladosApiUrl,
    },
    ...(barkDeviceKey && { bark: { deviceKey: barkDeviceKey } }),
    ...(cronSecret && { cron: { secret: cronSecret } }),
    appKey,
  };
}

export const env = validateEnv();
