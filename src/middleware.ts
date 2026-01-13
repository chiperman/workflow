import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 排除路径 (不需要鉴权的路径)
  const isPublicPath =
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('favicon.ico');

  // 2. 识别请求类型与特殊凭证
  const authHeader = request.headers.get('authorization');
  const xAppKey = request.headers.get('x-app-key');
  const isApiRequest = pathname.startsWith('/api/');

  // 3. 自动化绕过 (带有 Cron Secret 或 App Key 的请求)
  if (isApiRequest && (authHeader || xAppKey)) {
    return NextResponse.next();
  }

  // 4. Session 检查
  const session = request.cookies.get('workflow_session');

  if (!session) {
    if (isPublicPath) return NextResponse.next();

    if (isApiRequest) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5. 已登录重定向
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 匹配所有路径，除了 api/auth 已经手动在代码里处理了，这里可以保持通用
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
