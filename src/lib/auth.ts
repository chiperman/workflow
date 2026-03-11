import { PUBLIC_PATH_PREFIXES, PUBLIC_PATHS } from '@/config/constants';
import { Result } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * 统一的鉴权结果类型
 */
export type AuthResult =
  | { type: 'cron'; authorized: true }
  | { type: 'app-key'; authorized: true }
  | { type: 'session'; authorized: true }
  | { type: 'public'; authorized: true }
  | { type: 'none'; authorized: false; message: string };

/**
 * 鉴权配置常量
 */
export const AUTH_COOKIE_NAME = 'workflow_session';
export const AUTH_COOKIE_VALUE = 'authenticated';

/**
 * 验证请求的权限
 *
 * 该函数设计为在 Edge Runtime (Middleware) 和 Node.js 环境中通用。
 * 直接读取 process.env 避免复杂的依赖注入。
 *
 * @param req NextRequest 或标准 Request 对象
 */
export function verifyAuth(req: Request | NextRequest): AuthResult {
  const url = new URL(req.url);
  const { pathname } = url;

  // 1. 公开路径检查 (Public)
  const isPublicPath =
    PUBLIC_PATHS.some(p => p === pathname) ||
    PUBLIC_PATH_PREFIXES.some(p => pathname.startsWith(p));

  // 注意：即使是公开路径，如果携带了凭证，我们也优先验证凭证（以便 API 明确调用者身份）
  // 但对于 middleware 拦截来说，公开路径可以直接放行。
  // 这里我们返回一个特殊标记，让调用者决定。

  const headers = req.headers;
  const authHeader = headers.get('authorization');
  const xAppKey = headers.get('x-app-key');

  // 2. Cron Secret 检查 (Priority: High)
  // 用于定时任务自动触发
  if (authHeader) {
    const cronSecret = process.env.CRON_SECRET;
    // 如果未配置 CRON_SECRET，这层保护失效（但在 env.ts 中会警告）
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      return { type: 'cron', authorized: true };
    }
  }

  // 3. App Key 检查 (Priority: Medium)
  // 用于手动触发或 API 调用
  if (xAppKey) {
    const appKey = process.env.APP_KEY;
    if (appKey && xAppKey === appKey) {
      return { type: 'app-key', authorized: true };
    }
  }

  // 4. Session Cookie 检查 (Priority: Low)
  // 用于浏览器用户访问
  let hasSession = false;
  if ('cookies' in req) {
    // NextRequest
    const cookie = (req as NextRequest).cookies.get(AUTH_COOKIE_NAME);
    hasSession = cookie?.value === AUTH_COOKIE_VALUE;
  } else {
    // Standard Request (处理 header 中的 cookie 字符串)
    const cookieHeader = headers.get('cookie') || '';
    hasSession = cookieHeader.includes(`${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}`);
  }

  if (hasSession) {
    return { type: 'session', authorized: true };
  }

  // 5. 最终判定
  // 如果是公开路径且没有通过上述验证，则视为名为 'public' 的授权访问
  if (isPublicPath) {
    return { type: 'public', authorized: true };
  }

  return {
    type: 'none',
    authorized: false,
    message: authHeader || xAppKey ? 'Invalid credentials' : 'Unauthorized',
  };
}

/**
 * 验证操作权限 (Authorization)
 * 统一管理 "谁能做什么" 的逻辑，作为 Single Source of Truth。
 *
 * @param authType 当前用户的身份类型 (来自 verifyAuth)
 * @param trigger 想要执行的操作类型 ('auto' | 'manual')
 */

export function checkTriggerPermission(
  authType: AuthResult['type'],
  trigger: 'auto' | 'manual'
): Result<void> {
  // 规则 1: 自动触发 (Auto) 必须是 Cron (最高权限)
  if (trigger === 'auto') {
    if (authType === 'cron') {
      return { ok: true, data: undefined };
    }
    return { ok: false, error: 'Unauthorized (Cron only)' };
  }

  // 规则 2: 手动触发 (Manual) 允许 App Key 或 Session
  if (trigger === 'manual') {
    // Session 用户 (浏览器) 或 App Key (API调用) 都可以手动触发
    if (authType === 'app-key' || authType === 'session') {
      return { ok: true, data: undefined };
    }
    // Cron 虽然权限高，但为了安全和语义清晰，我们限制 Cron 只跑 Auto
    // Public 用户无权触发
    return { ok: false, error: 'Invalid trigger for this credential' };
  }

  return { ok: false, error: 'Unknown trigger type' };
}
