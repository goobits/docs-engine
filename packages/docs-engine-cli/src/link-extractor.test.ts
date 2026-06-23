import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  extractLinksFromFile,
  extractLinksFromFiles,
  groupLinksByType,
  type ExtractedLink,
} from './link-extractor';

/**
 * Tests exercise the real public API against real markdown files on disk.
 * No network access, no snapshots, no sleeps. A fresh temp dir is created per
 * test and removed afterward (cleanup is wrapped so a failure cannot leak).
 */

let tmpDir: string;

/** Write a fixture into the per-test temp dir and return its absolute path. */
function fixture(name: string, content: string): string {
  const p = join(tmpDir, name);
  writeFileSync(p, content, 'utf-8');
  return p;
}

/** Build an ExtractedLink for pure-function tests (no disk involved). */
function link(overrides: Partial<ExtractedLink> = {}): ExtractedLink {
  return {
    url: '/internal',
    text: 'text',
    file: 'mem.md',
    line: 1,
    type: 'link',
    isExternal: false,
    isAnchor: false,
    ...overrides,
  };
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'link-extractor-test-'));
});

afterEach(() => {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Never let cleanup failure fail/leak the suite.
  }
});

describe('extractLinksFromFile', () => {
  it('extracts an inline markdown link with type, text, url, and line number', () => {
    const file = fixture('basic.md', '# Title\n\nSee [the guide](./guide.md) here.\n');

    const links = extractLinksFromFile(file);

    expect(links).toHaveLength(1);
    const [l] = links;
    expect(l.type).toBe('link');
    expect(l.text).toBe('the guide');
    expect(l.url).toBe('./guide.md');
    expect(l.file).toBe(file);
    // Link sits on the third line of the file.
    expect(l.line).toBe(3);
  });

  it('extracts an image with type "image", alt text, src url, and line number', () => {
    const file = fixture('image.md', 'Intro line.\n\n![a cat](./cat.png)\n');

    const links = extractLinksFromFile(file);

    expect(links).toHaveLength(1);
    const [img] = links;
    expect(img.type).toBe('image');
    expect(img.text).toBe('a cat'); // alt text
    expect(img.url).toBe('./cat.png');
    expect(img.line).toBe(3);
  });

  it('reports accurate line numbers when links span multiple lines', () => {
    const content = ['[one](./one.md)', '', '', '[two](./two.md)'].join('\n');
    const file = fixture('lines.md', content);

    const links = extractLinksFromFile(file);

    const byUrl = Object.fromEntries(links.map((l) => [l.url, l.line]));
    expect(byUrl['./one.md']).toBe(1);
    expect(byUrl['./two.md']).toBe(4);
  });

  describe('URL classification', () => {
    it('classifies https URLs as external (not anchor)', () => {
      const file = fixture('ext.md', '[site](https://example.com/page)\n');

      const [l] = extractLinksFromFile(file);

      expect(l.isExternal).toBe(true);
      expect(l.isAnchor).toBe(false);
    });

    it('classifies http URLs as external', () => {
      const file = fixture('http.md', '[insecure](http://example.com)\n');

      const [l] = extractLinksFromFile(file);

      expect(l.isExternal).toBe(true);
      expect(l.isAnchor).toBe(false);
    });

    it('classifies anchor-only links as anchor (not external)', () => {
      const file = fixture('anchor.md', '[jump](#section-two)\n');

      const [l] = extractLinksFromFile(file);

      expect(l.isAnchor).toBe(true);
      expect(l.isExternal).toBe(false);
    });

    it('classifies relative internal links as neither external nor anchor', () => {
      const file = fixture('rel.md', '[doc](../other/doc.md)\n');

      const [l] = extractLinksFromFile(file);

      expect(l.isExternal).toBe(false);
      expect(l.isAnchor).toBe(false);
    });

    it('treats mailto links as NOT external (actual behavior: only http/https match)', () => {
      // The source classifies external strictly via /^https?:\/\//i, so a
      // mailto: link is neither external nor an anchor. This documents the
      // real, observable behavior rather than an assumed spec.
      const file = fixture('mail.md', '[email me](mailto:hello@example.com)\n');

      const [l] = extractLinksFromFile(file);

      expect(l.url).toBe('mailto:hello@example.com');
      expect(l.isExternal).toBe(false);
      expect(l.isAnchor).toBe(false);
    });
  });

  it('extracts multiple links and images from one file with correct types', () => {
    const content = [
      '[a](https://a.example.com)',
      '![img](./pic.png)',
      '[b](#anchor)',
      '[c](./local.md)',
    ].join('\n');
    const file = fixture('mixed.md', content);

    const links = extractLinksFromFile(file);

    expect(links).toHaveLength(4);
    const images = links.filter((l) => l.type === 'image');
    const mdLinks = links.filter((l) => l.type === 'link');
    expect(images).toHaveLength(1);
    expect(mdLinks).toHaveLength(3);
    expect(images[0].url).toBe('./pic.png');
  });

  it('returns an empty array for a file with prose but no links', () => {
    const file = fixture('nolinks.md', '# Heading\n\nJust some plain prose here.\n');

    expect(extractLinksFromFile(file)).toEqual([]);
  });

  it('returns an empty array for an empty file', () => {
    const file = fixture('empty.md', '');

    expect(extractLinksFromFile(file)).toEqual([]);
  });

  it('extracts links from MDX content (remark-mdx is enabled)', () => {
    // JSX/import syntax must not break parsing; the markdown link is still found.
    const content = [
      "import { Note } from './Note';",
      '',
      '<Note>hi</Note>',
      '',
      '[mdx link](./mdx-target.md)',
    ].join('\n');
    const file = fixture('doc.mdx', content);

    const links = extractLinksFromFile(file);

    const urls = links.map((l) => l.url);
    expect(urls).toContain('./mdx-target.md');
  });

  it('extracts raw HTML anchor tags as type "html"', () => {
    const content = 'Some text.\n\n<a href="https://html.example.com">click</a>\n';
    const file = fixture('html.md', content);

    const links = extractLinksFromFile(file);

    const htmlLinks = links.filter((l) => l.type === 'html');
    expect(htmlLinks).toHaveLength(1);
    const [h] = htmlLinks;
    expect(h.url).toBe('https://html.example.com');
    expect(h.isExternal).toBe(true);
    expect(h.line).toBe(3);
  });
});

describe('extractLinksFromFiles', () => {
  it('aggregates links across multiple files, preserving per-file paths', () => {
    const fileA = fixture('a.md', '[to b](./b.md)\n');
    const fileB = fixture('b.md', '[external](https://example.com)\n![pic](./p.png)\n');

    const links = extractLinksFromFiles([fileA, fileB]);

    expect(links).toHaveLength(3);
    expect(links.filter((l) => l.file === fileA)).toHaveLength(1);
    expect(links.filter((l) => l.file === fileB)).toHaveLength(2);
  });

  it('returns an empty array when given no files', () => {
    expect(extractLinksFromFiles([])).toEqual([]);
  });

  it('skips an unreadable file and still returns links from the readable ones', () => {
    // A missing path triggers the try/catch in the source (logs + continues),
    // so the readable file's links are still returned.
    const good = fixture('good.md', '[ok](./ok.md)\n');
    const missing = join(tmpDir, 'does-not-exist.md');

    const links = extractLinksFromFiles([missing, good]);

    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('./ok.md');
  });
});

describe('groupLinksByType', () => {
  it('groups links into internal, external, and anchor buckets', () => {
    const links: ExtractedLink[] = [
      link({ url: 'https://x.example.com', isExternal: true }),
      link({ url: '#top', isAnchor: true }),
      link({ url: './local.md' }),
      link({ url: 'http://y.example.com', isExternal: true }),
      link({ url: '../up.md' }),
    ];

    const grouped = groupLinksByType(links);

    expect(grouped.external).toHaveLength(2);
    expect(grouped.anchor).toHaveLength(1);
    expect(grouped.internal).toHaveLength(2);
    expect(grouped.internal.map((l) => l.url).sort()).toEqual(['../up.md', './local.md']);
  });

  it('returns empty buckets for an empty input', () => {
    const grouped = groupLinksByType([]);

    expect(grouped.internal).toEqual([]);
    expect(grouped.external).toEqual([]);
    expect(grouped.anchor).toEqual([]);
  });

  it('integrates with extracted links from disk', () => {
    const content = ['[ext](https://example.com)', '[anch](#section)', '[loc](./relative.md)'].join(
      '\n'
    );
    const file = fixture('group.md', content);

    const grouped = groupLinksByType(extractLinksFromFile(file));

    expect(grouped.external.map((l) => l.url)).toEqual(['https://example.com']);
    expect(grouped.anchor.map((l) => l.url)).toEqual(['#section']);
    expect(grouped.internal.map((l) => l.url)).toEqual(['./relative.md']);
  });
});
