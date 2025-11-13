import { RATE_LIMIT } from '../constants.js';

/**
 * Rate limit entry tracking request count and reset time
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter storage
 * @internal
 */
const limiter = new Map<string, RateLimitEntry>();

/**
 * Cleanup timer reference for proper disposal
 * @internal
 */
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start cleanup timer (lazy initialization to prevent memory leak)
 * @internal
 */
function startCleanupTimer(): void {
  if (cleanupTimer) return; // Already running

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limiter.entries()) {
      if (now > entry.resetAt) {
        limiter.delete(key);
      }
    }
  }, RATE_LIMIT.CLEANUP_INTERVAL);

  // Unref the timer so it doesn't prevent process exit
  cleanupTimer.unref();
}

/**
 * Check if a request is within rate limit
 *
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param maxRequests - Maximum requests allowed in the time window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns true if request is allowed, false if rate limit exceeded
 *
 * @example
 * ```typescript
 * if (!checkRateLimit(req.ip, RATE_LIMIT.SCREENSHOT_MAX_REQUESTS, RATE_LIMIT.SCREENSHOT_WINDOW_MS)) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 *
 * @public
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT.DEFAULT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT.DEFAULT_WINDOW_MS
): boolean {
  // Start cleanup timer on first use (lazy initialization)
  startCleanupTimer();

  const now = Date.now();
  const entry = limiter.get(identifier);

  if (!entry || now > entry.resetAt) {
    limiter.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Stop the cleanup timer and clear all rate limit entries
 * Useful for testing and graceful shutdown
 *
 * @public
 */
export function stopRateLimiter(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  limiter.clear();
}
