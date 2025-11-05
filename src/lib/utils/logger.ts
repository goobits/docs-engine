/**
 * Structured logging utility using pino
 * Provides type-safe, performant logging for the docs-engine
 */

import pino from 'pino';

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Logger configuration
 */
export interface LoggerConfig {
	/** Minimum log level to output */
	level?: LogLevel;
	/** Enable pretty printing for development */
	pretty?: boolean;
	/** Additional metadata to include in all logs */
	base?: Record<string, unknown>;
}

/**
 * Structured logger instance
 */
export type Logger = pino.Logger;

/**
 * Create a logger instance
 *
 * @param name - Logger name (typically module or component name)
 * @param config - Logger configuration
 * @returns Configured logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('symbol-generation');
 * logger.info({ files: 10 }, 'Processing TypeScript files');
 * logger.error({ error: err }, 'Failed to parse file');
 * ```
 */
export function createLogger(name: string, config?: LoggerConfig): Logger {
	const { level = 'info', pretty = false, base = {} } = config || {};

	// In production or when pretty is disabled, use fast JSON logging
	if (!pretty && process.env.NODE_ENV === 'production') {
		return pino({
			name,
			level,
			base: {
				...base,
				pid: process.pid
			}
		});
	}

	// In development or when pretty is enabled, use human-readable output
	return pino({
		name,
		level,
		base: {
			...base,
			pid: process.pid
		},
		transport: {
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'HH:MM:ss',
				ignore: 'pid,hostname',
				messageFormat: '{name} | {msg}'
			}
		}
	});
}

/**
 * Default logger for general-purpose logging
 * Use createLogger() for component-specific loggers
 */
export const logger = createLogger('docs-engine', {
	level: (process.env.LOG_LEVEL as LogLevel) || 'info',
	pretty: process.env.NODE_ENV !== 'production'
});

/**
 * Helper to get logger level from environment
 */
export function getLogLevel(): LogLevel {
	const envLevel = process.env.LOG_LEVEL?.toLowerCase();
	const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

	if (envLevel && validLevels.includes(envLevel as LogLevel)) {
		return envLevel as LogLevel;
	}

	return 'info';
}

/**
 * Create a child logger with additional context
 *
 * @param parent - Parent logger
 * @param bindings - Additional context to include in all child logs
 * @returns Child logger with context
 *
 * @example
 * ```typescript
 * const baseLogger = createLogger('api-parser');
 * const fileLogger = createChildLogger(baseLogger, { file: 'types.ts' });
 * fileLogger.info('Parsing file'); // Includes file: 'types.ts' in metadata
 * ```
 */
export function createChildLogger(
	parent: Logger,
	bindings: Record<string, unknown>
): Logger {
	return parent.child(bindings);
}

/**
 * Measure operation duration and log with timing
 *
 * @param logger - Logger to use
 * @param name - Operation name
 * @param fn - Function to measure
 * @returns Result of function execution
 *
 * @example
 * ```typescript
 * const result = await measureDuration(logger, 'file-processing', async () => {
 *   return await processFile(path);
 * });
 * // Logs: "file-processing completed in 123ms"
 * ```
 */
export async function measureDuration<T>(
	logger: Logger,
	name: string,
	fn: () => T | Promise<T>
): Promise<T> {
	const start = Date.now();

	try {
		const result = await fn();
		const duration = Date.now() - start;
		logger.info({ duration, operation: name }, `${name} completed`);
		return result;
	} catch (error) {
		const duration = Date.now() - start;
		logger.error(
			{ duration, operation: name, error },
			`${name} failed`
		);
		throw error;
	}
}

/**
 * Log error with full context
 *
 * @param logger - Logger to use
 * @param error - Error to log
 * @param message - Custom message
 * @param context - Additional context
 *
 * @example
 * ```typescript
 * try {
 *   await processFile(path);
 * } catch (error) {
 *   logError(logger, error, 'Failed to process file', { file: path });
 * }
 * ```
 */
export function logError(
	logger: Logger,
	error: unknown,
	message: string,
	context?: Record<string, unknown>
): void {
	const errorObj = error instanceof Error ? {
		name: error.name,
		message: error.message,
		stack: error.stack
	} : { error: String(error) };

	logger.error({
		...context,
		...errorObj
	}, message);
}
