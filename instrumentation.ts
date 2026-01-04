/**
 * Next.js Instrumentation Hook
 *
 * 此文件会在 Next.js 服务器启动时自动执行(仅一次)。
 * 用于在应用启动时验证环境变量,确保所有必需的配置都已设置。
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 只在 Node.js 运行时执行(服务端)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 导入并验证环境变量
    const { env } = await import('./src/lib/env');
    console.log('✅ Environment variables validated successfully');
    console.log('📋 Loaded services:', {
      supabase: !!env.supabase.url,
      leancloud: !!env.leancloud.appId,
      glados: !!env.glados.cookie,
      bark: !!env.bark?.deviceKey,
      cron: !!env.cron?.secret,
    });
  }
}
