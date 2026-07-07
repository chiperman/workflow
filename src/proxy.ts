import { verifyAuth } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 统一鉴权
  const authResult = verifyAuth(request);

  // 2. Api 路由处理
  if (pathname.startsWith('/api/')) {
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, message: authResult.message }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 3. 页面路由处理
  // 如果已登录用户访问登录页 -> 跳转首页
  if (pathname === '/login') {
    if (authResult.authorized && authResult.type === 'session') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 如果未登录用户访问受保护页面 -> 跳转登录
  // public 路径 (如 favicon) 已经在 authorized=true (type=public) 中
  if (!authResult.authorized) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // 匹配所有路径，除了 api/auth 已经手动在代码里处理了，这里可以保持通用
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
