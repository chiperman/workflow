import { env } from '@/lib/env';
import { withApiHandler } from '@/lib/api-helper';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 身份验证接口
 * POST /api/auth -> 登录
 */
export const POST = withApiHandler(async request => {
  const { key } = await request.json();

  if (!env.appKey) {
    return NextResponse.json({ success: false, message: '系统未配置 APP_KEY' }, { status: 500 });
  }

  if (key === env.appKey) {
    const cookieStore = await cookies();
    cookieStore.set('workflow_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return { success: true, message: '登录成功' };
  }

  return NextResponse.json({ success: false, message: '无效的访问密钥' }, { status: 401 });
});

/**
 * 登出接口
 * DELETE /api/auth -> 登出
 */
export const DELETE = withApiHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.delete('workflow_session');
  return { success: true, message: '已登出' };
});
