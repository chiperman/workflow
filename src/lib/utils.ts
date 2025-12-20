/**
 * Retries a promise-returning function a specified number of times with a delay.
 * 
 * @param fn The function to execute.
 * @param retries Number of attempts (defaults to 3).
 * @param delayMs Delay in milliseconds between attempts (defaults to 1000).
 * @returns The result of the function if successful.
 * @throws The last error encountered if all retries fail.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delayMs = 1000
): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        attempt++;
        try {
            return await fn();
        } catch (error) {
            if (attempt >= retries) {
                throw error;
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    throw new Error('Unreachable code in withRetry');
}
