/**
 * Browser-safe logger
 * @module
 */

/**
 * Browser logger interface
 * @public
 */
export interface BrowserLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
}

/**
 * Create a browser-compatible logger
 *
 * Uses console methods with module prefixes for client-side logging.
 * Safe to use in both SSR and client-side contexts.
 *
 * @param module - Module name for log prefixes
 * @returns Browser-compatible logger instance
 *
 * @example
 * ```typescript
 * import { createBrowserLogger } from '@goobits/docs-engine/utils';
 *
 * const logger = createBrowserLogger('MyComponent');
 * logger.info('Component mounted');
 * logger.error('Something went wrong', error);
 * ```
 *
 * @public
 */
export function createBrowserLogger(module: string): BrowserLogger {
  return {
    debug: (...args: unknown[]): void => console.debug(`[${module}]`, ...args),
    info: (...args: unknown[]): void => console.log(`[${module}]`, ...args),
    warn: (...args: unknown[]): void => console.warn(`[${module}]`, ...args),
    error: (...args: unknown[]): void => console.error(`[${module}]`, ...args),
    fatal: (...args: unknown[]): void => console.error(`[${module}] FATAL:`, ...args),
  };
}
