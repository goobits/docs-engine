import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limiter';

describe('rate-limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    expect(checkRateLimit('user1', 10, 60000)).toBe(true);
    expect(checkRateLimit('user1', 10, 60000)).toBe(true);
    expect(checkRateLimit('user1', 10, 60000)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('user2', 10, 60000)).toBe(true);
    }
    expect(checkRateLimit('user2', 10, 60000)).toBe(false);
  });

  it('should reset after window expires', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user3', 10, 60000);
    }
    expect(checkRateLimit('user3', 10, 60000)).toBe(false);

    vi.advanceTimersByTime(60001);
    expect(checkRateLimit('user3', 10, 60000)).toBe(true);
  });

  it('should handle different users independently', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user4', 10, 60000);
    }
    expect(checkRateLimit('user4', 10, 60000)).toBe(false);
    expect(checkRateLimit('user5', 10, 60000)).toBe(true);
  });

  it('should handle custom rate limits', () => {
    // Low limit
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('user6', 5, 60000)).toBe(true);
    }
    expect(checkRateLimit('user6', 5, 60000)).toBe(false);

    // High limit
    for (let i = 0; i < 100; i++) {
      expect(checkRateLimit('user7', 100, 60000)).toBe(true);
    }
    expect(checkRateLimit('user7', 100, 60000)).toBe(false);
  });

  it('should handle custom time windows', () => {
    // 1 second window
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit('user8', 3, 1000)).toBe(true);
    }
    expect(checkRateLimit('user8', 3, 1000)).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(checkRateLimit('user8', 3, 1000)).toBe(true);
  });

  it('should allow new requests after partial window expiry', () => {
    // First request
    checkRateLimit('user9', 10, 60000);

    // Advance time by 30 seconds (half window)
    vi.advanceTimersByTime(30000);

    // Should still be in same window, count should accumulate
    for (let i = 0; i < 9; i++) {
      expect(checkRateLimit('user9', 10, 60000)).toBe(true);
    }
    expect(checkRateLimit('user9', 10, 60000)).toBe(false);

    // Advance to beyond original window
    vi.advanceTimersByTime(30001);

    // Should allow new requests
    expect(checkRateLimit('user9', 10, 60000)).toBe(true);
  });

  it('should handle concurrent requests from same user', () => {
    const user = 'concurrent-user';
    const results: boolean[] = [];

    // Simulate 15 rapid requests
    for (let i = 0; i < 15; i++) {
      results.push(checkRateLimit(user, 10, 60000));
    }

    // First 10 should succeed, next 5 should fail
    expect(results.slice(0, 10).every((r) => r === true)).toBe(true);
    expect(results.slice(10).every((r) => r === false)).toBe(true);
  });

  it('should track count correctly across multiple requests', () => {
    const user = 'count-test';

    // Use 3 out of 5 quota
    for (let i = 0; i < 3; i++) {
      checkRateLimit(user, 5, 60000);
    }

    // Should have 2 remaining
    expect(checkRateLimit(user, 5, 60000)).toBe(true);
    expect(checkRateLimit(user, 5, 60000)).toBe(true);
    expect(checkRateLimit(user, 5, 60000)).toBe(false);
  });

  it('should handle empty identifier gracefully', () => {
    // Each request should be tracked separately even with empty identifier
    expect(checkRateLimit('', 2, 60000)).toBe(true);
    expect(checkRateLimit('', 2, 60000)).toBe(true);
    expect(checkRateLimit('', 2, 60000)).toBe(false);
  });

  it('should handle very short time windows', () => {
    // 100ms window
    checkRateLimit('short-window', 2, 100);
    checkRateLimit('short-window', 2, 100);
    expect(checkRateLimit('short-window', 2, 100)).toBe(false);

    vi.advanceTimersByTime(101);
    expect(checkRateLimit('short-window', 2, 100)).toBe(true);
  });
});
