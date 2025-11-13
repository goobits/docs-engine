import type { Handle } from '@sveltejs/kit';
import { checkRateLimit } from './lib/server/rate-limiter.js';
import { RATE_LIMIT, HTTP_STATUS } from './lib/constants.js';

export const handle: Handle = async ({ event, resolve }) => {
  // Rate limit screenshot endpoint
  if (event.url.pathname.startsWith('/api/screenshots')) {
    const ip = event.getClientAddress();
    if (!checkRateLimit(ip, RATE_LIMIT.DEFAULT_MAX_REQUESTS, RATE_LIMIT.DEFAULT_WINDOW_MS)) {
      return new Response('Rate limit exceeded', { status: HTTP_STATUS.TOO_MANY_REQUESTS });
    }
  }

  const response = await resolve(event);

  // Security headers
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:;"
  );
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS (only in production)
  if (event.url.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};
