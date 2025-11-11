import { describe, it, expect } from 'vitest';
import { linksPlugin } from './links';
import type { Root, Link } from 'mdast';

describe('links plugin', () => {
  const createLink = (url: string): Link => {
    return {
      type: 'link',
      url,
      children: [{ type: 'text', value: 'Link' }],
    };
  };

  const processTree = (url: string, options = {}): string => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [createLink(url)],
        },
      ],
    };
    const plugin = linksPlugin(options);
    const result = plugin(tree);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((result.children[0] as any).children[0] as Link).url;
  };

  it('should rewrite .md links to site paths', () => {
    const result = processTree('guides/cli.md');
    expect(result).toBe('/docs/guides/cli');
  });

  it('should handle relative .md links', () => {
    const result = processTree('../reference/api.md');
    expect(result).toBe('/docs/reference/api');
  });

  it('should preserve external links', () => {
    const result = processTree('https://google.com');
    expect(result).toBe('https://google.com');
  });

  it('should preserve anchor links', () => {
    const result = processTree('#heading');
    expect(result).toBe('#heading');
  });

  it('should handle .md links with anchors', () => {
    const result = processTree('guide.md#section');
    expect(result).toBe('/docs/guide#section');
  });

  it('should preserve mailto links', () => {
    const result = processTree('mailto:test@example.com');
    expect(result).toBe('mailto:test@example.com');
  });

  it('should preserve already processed /docs/ paths', () => {
    const result = processTree('/docs/guide');
    expect(result).toBe('/docs/guide');
  });

  // Test top-level files (README, LICENSE, etc.)
  const topLevelFiles = [
    { name: 'README', input: '../README.md', expected: '/README' },
    { name: 'LICENSE', input: '../LICENSE.md', expected: '/LICENSE' },
    { name: 'CONTRIBUTING', input: '../CONTRIBUTING.md', expected: '/CONTRIBUTING' },
    { name: 'CHANGELOG', input: '../CHANGELOG.md', expected: '/CHANGELOG' },
    { name: 'CODE_OF_CONDUCT', input: '../CODE_OF_CONDUCT.md', expected: '/CODE_OF_CONDUCT' },
    { name: 'SECURITY', input: '../SECURITY.md', expected: '/SECURITY' },
  ];

  it.each(topLevelFiles)('should handle top-level $name links', ({ input, expected }) => {
    const result = processTree(input);
    expect(result).toBe(expected);
  });

  it('should handle custom top-level files', () => {
    const result = processTree('../CUSTOM.md', { topLevelFiles: ['CUSTOM'] });
    expect(result).toBe('/CUSTOM');
  });

  it('should add /docs/ prefix for non-top-level relative links', () => {
    const result = processTree('../guide.md');
    expect(result).toBe('/docs/guide');
  });

  // Test external/protocol links that should be preserved
  const externalLinks = [
    { name: 'protocol-relative URLs', input: '//cdn.example.com/file.js' },
    { name: 'ftp:// links', input: 'ftp://example.com/file' },
    { name: 'http:// links', input: 'http://example.com' },
    { name: 'data: URIs', input: 'data:text/plain;base64,SGVsbG8=' },
  ];

  it.each(externalLinks)('should preserve $name', ({ input }) => {
    const result = processTree(input);
    expect(result).toBe(input);
  });

  it('should handle nested paths', () => {
    const result = processTree('guides/advanced/deep.md');
    expect(result).toBe('/docs/guides/advanced/deep');
  });

  it('should handle paths with trailing slashes', () => {
    const result = processTree('guides/');
    expect(result).toBe('/docs/guides');
  });

  it('should handle absolute paths', () => {
    const result = processTree('/root/path');
    expect(result).toBe('/root/path');
  });

  it('should normalize paths with ./', () => {
    const result = processTree('./guide.md');
    expect(result).toBe('/docs/guide');
  });
});
