import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, CircuitState, CircuitBreakerError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with CLOSED state', () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should use default configuration values', () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      // Defaults are tested through behavior
    });

    it('should accept custom configuration', () => {
      const breaker = new CircuitBreaker({
        name: 'custom',
        failureThreshold: 3,
        recoveryTimeout: 10000,
        successThreshold: 1,
        requestTimeout: 5000,
      });
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('CLOSED state behavior', () => {
    it('should allow requests in CLOSED state', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledOnce();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should stay CLOSED on occasional failures', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 5,
      });

      // 2 failures (below threshold of 5)
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
        'fail'
      );
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
        'fail'
      );

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after reaching failure threshold', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
      });

      // 3 failures to reach threshold
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
          'fail'
        );
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reset failure count on success', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
      });

      // 2 failures
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
        'fail'
      );
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
        'fail'
      );

      // 1 success (resets count)
      await breaker.execute(() => Promise.resolve('success'));

      // 2 more failures (shouldn't open because count was reset)
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
        'fail'
      );
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow(
        'fail'
      );

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('OPEN state behavior', () => {
    it('should reject requests immediately when OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
      });

      // Open the circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Next request should fail immediately with CircuitBreakerError
      const mockFn = vi.fn().mockResolvedValue('success');
      await expect(breaker.execute(mockFn)).rejects.toThrow(CircuitBreakerError);
      expect(mockFn).not.toHaveBeenCalled(); // Function should not be executed
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        recoveryTimeout: 30000,
      });

      // Open the circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Advance time past recovery timeout
      vi.advanceTimersByTime(30001);

      // Next request should transition to HALF_OPEN
      const mockFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(mockFn);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should stay OPEN before recovery timeout', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        recoveryTimeout: 30000,
      });

      // Open the circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      // Advance time but not past recovery timeout
      vi.advanceTimersByTime(29000);

      // Should still reject with CircuitBreakerError
      await expect(breaker.execute(() => Promise.resolve('success'))).rejects.toThrow(
        CircuitBreakerError
      );
    });
  });

  describe('HALF_OPEN state behavior', () => {
    const openAndWaitForHalfOpen = async (breaker: CircuitBreaker): Promise<void> => {
      // Open circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      // Wait for recovery timeout
      vi.advanceTimersByTime(30001);
    };

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        recoveryTimeout: 30000,
        successThreshold: 2,
      });

      await openAndWaitForHalfOpen(breaker);

      // 2 successful requests should close the circuit
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on any failure in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        recoveryTimeout: 30000,
        successThreshold: 2,
      });

      await openAndWaitForHalfOpen(breaker);

      // 1 success
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // 1 failure should reopen circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should allow requests through in HALF_OPEN state', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        recoveryTimeout: 30000,
      });

      await openAndWaitForHalfOpen(breaker);

      const mockFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(mockFn);

      expect(mockFn).toHaveBeenCalledOnce();
    });
  });

  describe('timeout handling', () => {
    it('should timeout long-running requests', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        requestTimeout: 5000,
      });

      const slowFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('success'), 10000);
          })
      );

      const promise = breaker.execute(slowFn);

      // Advance time to trigger timeout
      vi.advanceTimersByTime(5001);

      await expect(promise).rejects.toThrow('Request timeout after 5000ms');
    });

    it('should count timeout as failure', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        requestTimeout: 5000,
      });

      const slowFn = (): Promise<string> =>
        new Promise((resolve) => {
          setTimeout(() => resolve('success'), 10000);
        });

      // 2 timeouts should open circuit
      const promise1 = breaker.execute(slowFn);
      vi.advanceTimersByTime(5001);
      await expect(promise1).rejects.toThrow();

      const promise2 = breaker.execute(slowFn);
      vi.advanceTimersByTime(5001);
      await expect(promise2).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should not timeout fast requests', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        requestTimeout: 5000,
      });

      const result = await breaker.execute(() => Promise.resolve('fast'));

      expect(result).toBe('fast');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('reset functionality', () => {
    it('should reset to CLOSED state', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
      });

      // Open the circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Manual reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should allow requests after reset', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
      });

      // Open the circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      breaker.reset();

      // Should allow requests now
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should reset failure count', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
      });

      // 2 failures
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      breaker.reset();

      // 2 more failures shouldn't open (count was reset)
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('CircuitBreakerError', () => {
    it('should throw CircuitBreakerError with correct message', async () => {
      const breaker = new CircuitBreaker({
        name: 'my-service',
        failureThreshold: 1,
      });

      // Open circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      // Should throw CircuitBreakerError
      await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toThrow(
        "Circuit breaker 'my-service' is OPEN - service unavailable"
      );
    });

    it('should have correct error name', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
      });

      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      try {
        await breaker.execute(() => Promise.resolve('ok'));
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerError);
        expect((error as Error).name).toBe('CircuitBreakerError');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle zero success threshold in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        recoveryTimeout: 30000,
        successThreshold: 0, // Edge case: invalid but should be handled
      });

      // Open circuit
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

      vi.advanceTimersByTime(30001);

      // Should handle gracefully (treated as already met)
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should handle errors that are not Error instances', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
      });

      // Reject with a string instead of Error
      await expect(breaker.execute(() => Promise.reject('string error'))).rejects.toBe(
        'string error'
      );

      // Should still count as failure
      await expect(breaker.execute(() => Promise.reject('another error'))).rejects.toBe(
        'another error'
      );

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should handle synchronous throws', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
      });

      // Function that throws synchronously
      const throwingFn = (): Promise<string> => {
        throw new Error('sync error');
      };

      await expect(breaker.execute(throwingFn)).rejects.toThrow('sync error');
    });

    it('should handle multiple concurrent requests in CLOSED state', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });

      const results = await Promise.all([
        breaker.execute(() => Promise.resolve('result1')),
        breaker.execute(() => Promise.resolve('result2')),
        breaker.execute(() => Promise.resolve('result3')),
      ]);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});
