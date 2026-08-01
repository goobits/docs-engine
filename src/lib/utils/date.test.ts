import { describe, expect, it } from 'vitest';
import { formatRelativeDate } from './date';

describe('formatRelativeDate', () => {
  it('returns "today" for today\'s date', () => {
    expect(formatRelativeDate(new Date())).toBe('today');
  });

  it('returns "yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday)).toBe('yesterday');
  });

  it('returns days ago for recent dates', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns weeks ago for dates within a month', () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns months ago for dates within a year', () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    expect(formatRelativeDate(threeMonthsAgo)).toMatch(/\d+ months ago/);
  });

  it('returns years ago for old dates', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    expect(formatRelativeDate(twoYearsAgo)).toMatch(/\d+ years ago/);
  });
});
