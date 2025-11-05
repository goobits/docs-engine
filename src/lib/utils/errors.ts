/**
 * Custom error classes for docs-engine
 * Provides type-safe, structured error handling across the codebase
 */

/**
 * Base error class for all docs-engine errors
 */
export class DocsEngineError extends Error {
	constructor(message: string, public readonly code?: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace?.(this, this.constructor);
	}
}

/**
 * Error thrown when file I/O operations fail
 */
export class FileIOError extends DocsEngineError {
	constructor(
		message: string,
		public readonly path: string,
		public readonly operation: 'read' | 'write' | 'delete' | 'stat' | 'readdir' | 'mkdir',
		public readonly originalError?: unknown
	) {
		super(message, 'FILE_IO_ERROR');
		this.name = 'FileIOError';
	}

	static read(path: string, error?: unknown): FileIOError {
		return new FileIOError(`Failed to read file: ${path}`, path, 'read', error);
	}

	static write(path: string, error?: unknown): FileIOError {
		return new FileIOError(`Failed to write file: ${path}`, path, 'write', error);
	}

	static delete(path: string, error?: unknown): FileIOError {
		return new FileIOError(`Failed to delete file: ${path}`, path, 'delete', error);
	}

	static stat(path: string, error?: unknown): FileIOError {
		return new FileIOError(`Failed to stat file: ${path}`, path, 'stat', error);
	}

	static readdir(path: string, error?: unknown): FileIOError {
		return new FileIOError(`Failed to read directory: ${path}`, path, 'readdir', error);
	}

	static mkdir(path: string, error?: unknown): FileIOError {
		return new FileIOError(`Failed to create directory: ${path}`, path, 'mkdir', error);
	}
}

/**
 * Error thrown during markdown processing
 */
export class ProcessingError extends DocsEngineError {
	constructor(
		message: string,
		public readonly filePath?: string,
		public readonly phase?: string,
		public readonly originalError?: unknown
	) {
		super(message, 'PROCESSING_ERROR');
		this.name = 'ProcessingError';
	}

	static parse(filePath: string, error?: unknown): ProcessingError {
		return new ProcessingError(`Failed to parse: ${filePath}`, filePath, 'parse', error);
	}

	static transform(filePath: string, phase: string, error?: unknown): ProcessingError {
		return new ProcessingError(
			`Failed to transform: ${filePath} (phase: ${phase})`,
			filePath,
			phase,
			error
		);
	}

	static generate(filePath: string, error?: unknown): ProcessingError {
		return new ProcessingError(`Failed to generate: ${filePath}`, filePath, 'generate', error);
	}
}

/**
 * Error thrown during validation
 */
export class ValidationError extends DocsEngineError {
	constructor(
		message: string,
		public readonly field?: string,
		public readonly value?: unknown
	) {
		super(message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}

	static invalidType(field: string, expected: string, received: unknown): ValidationError {
		return new ValidationError(
			`Invalid type for ${field}: expected ${expected}, received ${typeof received}`,
			field,
			received
		);
	}

	static required(field: string): ValidationError {
		return new ValidationError(`Required field missing: ${field}`, field);
	}

	static invalidValue(field: string, value: unknown, reason?: string): ValidationError {
		const msg = reason
			? `Invalid value for ${field}: ${reason}`
			: `Invalid value for ${field}: ${value}`;
		return new ValidationError(msg, field, value);
	}
}

/**
 * Error thrown when external commands fail
 */
export class CommandExecutionError extends DocsEngineError {
	constructor(
		message: string,
		public readonly command: string,
		public readonly exitCode?: number,
		public readonly stderr?: string,
		public readonly stdout?: string
	) {
		super(message, 'COMMAND_EXECUTION_ERROR');
		this.name = 'CommandExecutionError';
	}

	static failed(command: string, exitCode: number, stderr?: string): CommandExecutionError {
		return new CommandExecutionError(
			`Command failed with exit code ${exitCode}: ${command}`,
			command,
			exitCode,
			stderr
		);
	}

	static timeout(command: string, timeoutMs: number): CommandExecutionError {
		return new CommandExecutionError(
			`Command timed out after ${timeoutMs}ms: ${command}`,
			command
		);
	}
}

/**
 * Error thrown when screenshot generation fails
 */
export class ScreenshotError extends DocsEngineError {
	constructor(
		message: string,
		public readonly url?: string,
		public readonly selector?: string,
		public readonly originalError?: unknown
	) {
		super(message, 'SCREENSHOT_ERROR');
		this.name = 'ScreenshotError';
	}

	static browserLaunch(error?: unknown): ScreenshotError {
		return new ScreenshotError('Failed to launch browser', undefined, undefined, error);
	}

	static pageLoad(url: string, error?: unknown): ScreenshotError {
		return new ScreenshotError(`Failed to load page: ${url}`, url, undefined, error);
	}

	static elementNotFound(selector: string, url?: string): ScreenshotError {
		return new ScreenshotError(
			`Element not found: ${selector}`,
			url,
			selector
		);
	}

	static capture(url: string, selector?: string, error?: unknown): ScreenshotError {
		return new ScreenshotError(
			`Failed to capture screenshot: ${url}`,
			url,
			selector,
			error
		);
	}
}

/**
 * Error thrown during image processing
 */
export class ImageProcessingError extends DocsEngineError {
	constructor(
		message: string,
		public readonly imagePath?: string,
		public readonly operation?: string,
		public readonly originalError?: unknown
	) {
		super(message, 'IMAGE_PROCESSING_ERROR');
		this.name = 'ImageProcessingError';
	}

	static resize(imagePath: string, error?: unknown): ImageProcessingError {
		return new ImageProcessingError(
			`Failed to resize image: ${imagePath}`,
			imagePath,
			'resize',
			error
		);
	}

	static convert(imagePath: string, format: string, error?: unknown): ImageProcessingError {
		return new ImageProcessingError(
			`Failed to convert image to ${format}: ${imagePath}`,
			imagePath,
			`convert-${format}`,
			error
		);
	}

	static optimize(imagePath: string, error?: unknown): ImageProcessingError {
		return new ImageProcessingError(
			`Failed to optimize image: ${imagePath}`,
			imagePath,
			'optimize',
			error
		);
	}
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends DocsEngineError {
	constructor(
		message: string,
		public readonly configKey?: string,
		public readonly configValue?: unknown
	) {
		super(message, 'CONFIGURATION_ERROR');
		this.name = 'ConfigurationError';
	}

	static missing(key: string): ConfigurationError {
		return new ConfigurationError(`Missing required configuration: ${key}`, key);
	}

	static invalid(key: string, value: unknown, reason?: string): ConfigurationError {
		const msg = reason
			? `Invalid configuration for ${key}: ${reason}`
			: `Invalid configuration for ${key}: ${value}`;
		return new ConfigurationError(msg, key, value);
	}
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	options: {
		maxRetries?: number;
		initialDelayMs?: number;
		maxDelayMs?: number;
		onRetry?: (error: unknown, attempt: number) => void;
	} = {}
): Promise<T> {
	const {
		maxRetries = 3,
		initialDelayMs = 1000,
		maxDelayMs = 30000,
		onRetry
	} = options;

	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Don't retry validation errors or configuration errors
			if (error instanceof ValidationError || error instanceof ConfigurationError) {
				throw error;
			}

			// Last attempt failed
			if (attempt === maxRetries) {
				throw error;
			}

			// Calculate delay with exponential backoff
			const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

			// Call retry callback if provided
			onRetry?.(error, attempt + 1);

			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Type guard to check if error is a DocsEngineError
 */
export function isDocsEngineError(error: unknown): error is DocsEngineError {
	return error instanceof DocsEngineError;
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return String(error);
}

/**
 * Get error stack from unknown error
 */
export function getErrorStack(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.stack;
	}
	return undefined;
}
