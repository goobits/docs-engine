interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limiter = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
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

// Cleanup old entries periodically
// eslint-disable-next-line no-undef
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limiter.entries()) {
    if (now > entry.resetAt) {
      limiter.delete(key);
    }
  }
}, 60000);
