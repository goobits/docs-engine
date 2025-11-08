/**
 * Structured logging with Pino
 *
 * Provides consistent, structured logging across the application with proper
 * log levels, automatic error serialization, and production-friendly output.
 *
 * @module
 */

import pino from 'pino';

/**
 * Log levels available
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Create logger instance with production-ready defaults
 *
 * In development: Pretty-printed logs with colors
 * In production: JSON logs for log aggregation systems
 *
 * @param name - Logger name (typically module or component name)
 * @param options - Optional pino configuration
 * @returns Configured logger instance
 *
 * @example
 * ```typescript
 * import { createLogger } from '@goobits/docs-engine/server';
 *
 * const logger = createLogger('screenshot-service');
 *
 * logger.info({ url: 'https://example.com' }, 'Generating screenshot');
 * logger.error({ err }, 'Screenshot generation failed');
 * ```
 *
 * @public
 */
export function createLogger(name: string, options: pino.LoggerOptions = {}): pino.Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return pino({
    name,
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    ...options,
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  });
}

/**
 * Default logger instance for general use
 *
 * @public
 */
export const logger = createLogger('docs-engine');
