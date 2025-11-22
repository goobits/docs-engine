/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures by stopping requests to a failing service
 * and allowing time for recovery. After a threshold of failures, the circuit
 * "opens" and rejects requests immediately without attempting them.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, reject requests immediately
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 *
 * @module
 */

import { createLogger } from './logger.js';
import { CIRCUIT_BREAKER } from '../constants.js';

const logger = createLogger('circuit-breaker');

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name for logging */
  name: string;
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms before attempting recovery (default: 30000ms = 30s) */
  recoveryTimeout: number;
  /** Number of successful requests in HALF_OPEN before closing (default: 2) */
  successThreshold: number;
  /** Timeout for individual requests in ms (default: 10000ms = 10s) */
  requestTimeout: number;
}

/**
 * Circuit breaker error thrown when circuit is open
 */
export class CircuitBreakerError extends Error {
  constructor(name: string) {
    super(`Circuit breaker '${name}' is OPEN - service unavailable`);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker implementation
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   name: 'screenshot-service',
 *   failureThreshold: 5,
 *   recoveryTimeout: 30000,
 *   successThreshold: 2,
 *   requestTimeout: 10000,
 * });
 *
 * try {
 *   const result = await breaker.execute(async () => {
 *     return await generateScreenshot(url);
 *   });
 * } catch (err) {
 *   if (err instanceof CircuitBreakerError) {
 *     // Circuit is open, service unavailable
 *   }
 * }
 * ```
 *
 * @public
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = {
      failureThreshold: config.failureThreshold ?? CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      recoveryTimeout: config.recoveryTimeout ?? CIRCUIT_BREAKER.RECOVERY_TIMEOUT,
      successThreshold: config.successThreshold ?? CIRCUIT_BREAKER.SUCCESS_THRESHOLD,
      requestTimeout: config.requestTimeout ?? CIRCUIT_BREAKER.REQUEST_TIMEOUT,
      name: config.name,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param fn - Async function to execute
   * @returns Promise with function result
   * @throws CircuitBreakerError if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        logger.warn(
          {
            breaker: this.config.name,
            state: this.state,
            nextAttempt: new Date(this.nextAttempt).toISOString(),
          },
          'Circuit breaker is OPEN'
        );
        throw new CircuitBreakerError(this.config.name);
      }

      // Try recovery
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      logger.info({ breaker: this.config.name }, 'Circuit breaker entering HALF_OPEN state');
    }

    try {
      // Add timeout to prevent hanging
      const result = await this.withTimeout(fn());

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Wrap promise with timeout
   * Properly cleans up timer to prevent memory leaks
   */
  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`));
      }, this.config.requestTimeout);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        logger.info({ breaker: this.config.name }, 'Circuit breaker CLOSED - service recovered');
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(error: unknown): void {
    this.failureCount++;
    this.successCount = 0;

    logger.warn(
      {
        breaker: this.config.name,
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold,
        error: error instanceof Error ? error.message : String(error),
      },
      'Circuit breaker request failed'
    );

    if (
      this.failureCount >= this.config.failureThreshold ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;

      logger.error(
        {
          breaker: this.config.name,
          nextAttempt: new Date(this.nextAttempt).toISOString(),
        },
        'Circuit breaker OPEN - too many failures'
      );
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();

    logger.info({ breaker: this.config.name }, 'Circuit breaker manually reset to CLOSED');
  }
}
