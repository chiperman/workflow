import { RETRY_CONFIG } from '@/config/constants';

/**
 * 获取当前的北京时间字符串
 */
export function getBeijingTime(date: Date = new Date()): string {
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
  });
}

/**
 * Retries a promise-returning function with intelligent error handling.
 *
 * Features:
 * - Distinguishes between retryable and non-retryable errors
 * - Uses exponential backoff for retry delays
 * - Logs retry attempts for debugging
 *
 * @param fn The function to execute.
 * @param retries Number of attempts (defaults to 3).
 * @param delayMs Base delay in milliseconds between attempts (defaults to 1000).
 * @returns The result of the function if successful.
 * @throws The last error encountered if all retries fail or if error is non-retryable.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = RETRY_CONFIG.MAX_RETRIES,
  delayMs: number = RETRY_CONFIG.BASE_DELAY_MS
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < retries) {
    attempt++;
    try {
      const result = await fn();

      // 如果是重试成功则记录日志
      if (attempt > 1) {
        console.log(`✓ Retry succeeded on attempt ${attempt}/${retries}`);
      }

      return result;
    } catch (error: unknown) {
      lastError = error;

      // 检查是否为不可重试错误
      const isNonRetryable = isConfigurationError(error);

      if (isNonRetryable) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : error && typeof error === 'object' && 'code' in error
              ? String(error.code)
              : 'Unknown';
        console.warn(`✗ Non-retryable error detected: ${errorMsg}`);
        throw error;
      }

      // 检查是否已用尽所有重试次数
      if (attempt >= retries) {
        console.error(`✗ All ${retries} retry attempts failed`);
        throw error;
      }

      // 使用指数退避计算延迟:1s, 2s, 4s
      const delay = delayMs * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
      console.log(`⟳ Retry attempt ${attempt}/${retries} failed. Retrying in ${delay}ms...`);
      const errorMsg =
        error instanceof Error
          ? error.message
          : error && typeof error === 'object' && 'code' in error
            ? String(error.code)
            : 'Unknown error';
      console.log(`  Error: ${errorMsg}`);

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 这里永远不会达到，但 TypeScript 需要它
  throw lastError || new Error('Unreachable code in withRetry');
}

/**
 * Determines if an error is a configuration error that should not be retried.
 *
 * Non-retryable errors include:
 * - Database table/class does not exist
 * - Missing environment variables
 * - Authentication/permission errors
 *
 * @param error The error to check
 * @returns true if the error should not be retried
 */
function isConfigurationError(error: unknown): boolean {
  const errorMessage = (error instanceof Error ? error.message : '').toLowerCase();
  const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';

  // Supabase: 表不存在
  if (errorCode === '42P01') return true;

  // LeanCloud: 类不存在（当是配置问题时，而非自动创建场景）
  // 注意：我们允许 404 重试，以防是临时问题

  // 缺少环境变量
  if (errorMessage.includes('missing environment')) return true;
  if (errorMessage.includes('missing env')) return true;

  // 认证错误
  if (errorMessage.includes('authentication failed')) return true;
  if (errorMessage.includes('invalid credentials')) return true;
  if (errorMessage.includes('permission denied')) return true;

  // 无效配置
  if (errorMessage.includes('invalid configuration')) return true;

  // 所有其他错误都被认为是可重试的（网络问题、超时等）
  return false;
}
