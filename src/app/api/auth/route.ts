import { env } from '@/lib/env';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * 身份验证接口
 * POST /api/auth -> 登录
 * DELETE /api/auth -> 登出
 */

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key || key !== env.appKey) {
      return NextResponse.json({ success: false, message: '无效的访问密钥' }, { status: 401 });
    }

    // 设置 Cookie (有效期 30 天)
    const cookieStore = await cookies();
    cookieStore.set('workflow_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ success: true, message: '登录成功' });
  } catch (_error) {
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('workflow_session');
  return NextResponse.json({ success: true, message: '已登出' });
}
