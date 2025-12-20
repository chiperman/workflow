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
    retries = 3,
    delayMs = 1000
): Promise<T> {
    let attempt = 0;
    let lastError: any;

    while (attempt < retries) {
        attempt++;
        try {
            const result = await fn();

            // Log success if this was a retry
            if (attempt > 1) {
                console.log(`✓ Retry succeeded on attempt ${attempt}/${retries}`);
            }

            return result;
        } catch (error: any) {
            lastError = error;

            // Check if this is a non-retryable error
            const isNonRetryable = isConfigurationError(error);

            if (isNonRetryable) {
                console.warn(`✗ Non-retryable error detected: ${error.message || error.code}`);
                throw error;
            }

            // Check if we've exhausted all retries
            if (attempt >= retries) {
                console.error(`✗ All ${retries} retry attempts failed`);
                throw error;
            }

            // Calculate delay with exponential backoff: 1s, 2s, 4s
            const delay = delayMs * Math.pow(2, attempt - 1);
            console.log(`⟳ Retry attempt ${attempt}/${retries} failed. Retrying in ${delay}ms...`);
            console.log(`  Error: ${error.message || error.code || 'Unknown error'}`);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // This should never be reached, but TypeScript requires it
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
function isConfigurationError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    // Supabase: Table does not exist
    if (errorCode === '42P01') return true;

    // LeanCloud: Class does not exist (when it's a config issue, not auto-create scenario)
    // Note: We allow 404 to retry in case it's a temporary issue

    // Missing environment variables
    if (errorMessage.includes('missing environment')) return true;
    if (errorMessage.includes('missing env')) return true;

    // Authentication errors
    if (errorMessage.includes('authentication failed')) return true;
    if (errorMessage.includes('invalid credentials')) return true;
    if (errorMessage.includes('permission denied')) return true;

    // Invalid configuration
    if (errorMessage.includes('invalid configuration')) return true;

    // All other errors are considered retryable (network issues, timeouts, etc.)
    return false;
}
