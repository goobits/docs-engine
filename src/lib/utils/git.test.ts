import { describe, it, expect } from 'vitest';
import { generateEditLink, type GitConfig } from './git';

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
});
