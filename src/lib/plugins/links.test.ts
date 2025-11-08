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

  it('should handle top-level README links', () => {
    const result = processTree('../README.md');
    expect(result).toBe('/README');
  });

  it('should handle top-level LICENSE links', () => {
    const result = processTree('../LICENSE.md');
    expect(result).toBe('/LICENSE');
  });

  it('should handle CONTRIBUTING links', () => {
    const result = processTree('../CONTRIBUTING.md');
    expect(result).toBe('/CONTRIBUTING');
  });

  it('should handle custom top-level files', () => {
    const result = processTree('../CUSTOM.md', { topLevelFiles: ['CUSTOM'] });
    expect(result).toBe('/CUSTOM');
  });

  it('should add /docs/ prefix for non-top-level relative links', () => {
    const result = processTree('../guide.md');
    expect(result).toBe('/docs/guide');
  });

  it('should handle protocol-relative URLs', () => {
    const result = processTree('//cdn.example.com/file.js');
    expect(result).toBe('//cdn.example.com/file.js');
  });

  it('should handle ftp:// links', () => {
    const result = processTree('ftp://example.com/file');
    expect(result).toBe('ftp://example.com/file');
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

  it('should handle CHANGELOG links', () => {
    const result = processTree('../CHANGELOG.md');
    expect(result).toBe('/CHANGELOG');
  });

  it('should handle CODE_OF_CONDUCT links', () => {
    const result = processTree('../CODE_OF_CONDUCT.md');
    expect(result).toBe('/CODE_OF_CONDUCT');
  });

  it('should handle SECURITY links', () => {
    const result = processTree('../SECURITY.md');
    expect(result).toBe('/SECURITY');
  });

  it('should handle http:// links', () => {
    const result = processTree('http://example.com');
    expect(result).toBe('http://example.com');
  });

  it('should handle data: URIs', () => {
    const result = processTree('data:text/plain;base64,SGVsbG8=');
    expect(result).toBe('data:text/plain;base64,SGVsbG8=');
  });
});
