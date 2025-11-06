import { describe, it, expect } from 'vitest';
import { generateEditLink, formatRelativeDate, type GitConfig } from './git';

describe('git utilities', () => {
  describe('generateEditLink', () => {
    it('should generate correct GitHub edit link', () => {
      const config: GitConfig = {
        repoUrl: 'https://github.com/user/repo',
        branch: 'main',
        docsPath: 'docs',
      };
      const link = generateEditLink('getting-started.md', config);
      expect(link).toBe('https://github.com/user/repo/edit/main/docs/getting-started.md');
    });

    it('should generate correct GitLab edit link', () => {
      const config: GitConfig = {
        repoUrl: 'https://gitlab.com/user/repo',
        branch: 'main',
        docsPath: 'docs',
      };
      const link = generateEditLink('getting-started.md', config);
      expect(link).toBe('https://gitlab.com/user/repo/-/edit/main/docs/getting-started.md');
    });

    it('should handle custom branch', () => {
      const config: GitConfig = {
        repoUrl: 'https://github.com/user/repo',
        branch: 'develop',
        docsPath: 'docs',
      };
      const link = generateEditLink('api.md', config);
      expect(link).toBe('https://github.com/user/repo/edit/develop/docs/api.md');
    });

    it('should handle empty docsPath', () => {
      const config: GitConfig = {
        repoUrl: 'https://github.com/user/repo',
        branch: 'main',
        docsPath: '',
      };
      const link = generateEditLink('readme.md', config);
      expect(link).toBe('https://github.com/user/repo/edit/main/readme.md');
    });

    it('should remove trailing slash from repoUrl', () => {
      const config: GitConfig = {
        repoUrl: 'https://github.com/user/repo/',
        branch: 'main',
        docsPath: 'docs',
      };
      const link = generateEditLink('test.md', config);
      expect(link).toBe('https://github.com/user/repo/edit/main/docs/test.md');
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "today" for today\'s date', () => {
      const today = new Date();
      expect(formatRelativeDate(today)).toBe('today');
    });

    it('should return "yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeDate(yesterday)).toBe('yesterday');
    });

    it('should return days ago for recent dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return weeks ago for dates within a month', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
    });

    it('should return months ago for dates within a year', () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      expect(formatRelativeDate(threeMonthsAgo)).toMatch(/\d+ months ago/);
    });

    it('should return years ago for old dates', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      expect(formatRelativeDate(twoYearsAgo)).toMatch(/\d+ years ago/);
    });
  });
});
