import pino from 'pino';
import type { Logger } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

// Browser logger interface
interface BrowserLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
}

// Create child loggers for different modules
export const createLogger = (module: string): Logger => logger.child({ module });

// Browser-compatible logger (for client-side code)
export const createBrowserLogger = (module: string): Logger | BrowserLogger => {
  if (typeof window === 'undefined') {
    // Server-side: use pino
    return createLogger(module);
  }

  // Client-side: use console with module prefix
  return {
    debug: (...args: unknown[]): void => console.debug(`[${module}]`, ...args),
    info: (...args: unknown[]): void => console.log(`[${module}]`, ...args),
    warn: (...args: unknown[]): void => console.warn(`[${module}]`, ...args),
    error: (...args: unknown[]): void => console.error(`[${module}]`, ...args),
    fatal: (...args: unknown[]): void => console.error(`[${module}] FATAL:`, ...args),
  };
};
