import { dev } from '$app/environment';

/**
 * Log an error with context prefix
 */
export function logError(context: string, message: string, error: unknown): void {
  console.error(`[${context}] ${message}`, error);

  // In dev, also log stack trace separately for easier reading
  if (dev && error instanceof Error && error.stack) {
    console.error(`[${context}] Stack trace:`, error.stack);
  }
}

/**
 * Log a warning with context prefix
 */
export function logWarning(context: string, message: string, details?: unknown): void {
  console.warn(`[${context}] ${message}`, details || '');
}

/**
 * Create a development error with helpful details
 */
export function createDevError(
  statusCode: number,
  message: string,
  details: string,
  hint?: string
): { message: string; details: string; hint: string } | string {
  if (dev) {
    return {
      message,
      details,
      hint: hint || 'Check the server logs for more details.',
    };
  }
  // Generic message in production
  return message;
}
