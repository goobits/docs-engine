/**
 * Behavior-focused tests for the link-checker CLI module.
 *
 * These tests build real markdown fixtures on disk (under the OS tmp dir) and
 * exercise the public API: extractLinks, checkLinks, generateReport.
 *
 * IMPORTANT: every call uses `checkExternal: false`, so NO network requests are
 * ever made. Only internal file links and same-file/cross-file anchors are
 * validated. External (http/https) links are intentionally left unchecked.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  extractLinks,
  checkLinks,
  generateReport,
  type LinkCheckerConfig,
  type DocumentLink,
  type LinkCheckResult,
} from './link-checker';

/** Build the config for a given docs dir, always with external checking OFF. */
function configFor(docsDir: string): LinkCheckerConfig {
  return { docsDir, checkExternal: false };
}

/** Find the single result for a link with the given url (throws if absent). */
function resultForUrl(results: LinkCheckResult[], url: string): LinkCheckResult {
  const match = results.find((r) => r.link.url === url);
  if (!match) {
    throw new Error(`No result found for url ${JSON.stringify(url)}`);
  }
  return match;
}

describe('link-checker', () => {
  // Main fixture directory exercising the full range of link behaviors.
  let docsDir: string;

  beforeAll(() => {
    docsDir = mkdtempSync(join(tmpdir(), 'link-checker-test-'));

    // index.md: links out to guide.md (with and without extension), an anchor
    // that lives in *another* file, a missing file, an external link, and an
    // image pointing at a non-existent asset.
    writeFileSync(
      join(docsDir, 'index.md'),
      [
        '# Getting Started',
        '',
        'See the [guide](./guide.md) for details.',
        'You can also link [without extension](./guide).',
        'Link to a [missing page](./does-not-exist.md).',
        'An [external site](https://example.com) is left unchecked.',
        '![diagram](./missing-image.png)',
        '',
      ].join('\n')
    );

    // guide.md: a valid cross-file anchor back into index.md, a broken cross-file
    // anchor, plus a heading that anchors can target.
    writeFileSync(
      join(docsDir, 'guide.md'),
      [
        '# Guide Title',
        '',
        '## Section Two',
        '',
        'Back to [the intro heading](./index.md#getting-started).',
        'A [bad cross-file anchor](./index.md#no-such-heading).',
        '',
      ].join('\n')
    );

    // anchors.md: same-file anchor links (the file the link lives in is the file
    // searched for the heading slug).
    writeFileSync(
      join(docsDir, 'anchors.md'),
      [
        '# Page Title',
        '',
        '## Installation Guide',
        '',
        'Jump to [install](#installation-guide).',
        'Jump to a [ghost section](#ghost-section).',
        '',
      ].join('\n')
    );

    // Nested file to prove glob discovers markdown recursively.
    const nested = join(docsDir, 'nested');
    mkdirSync(nested, { recursive: true });
    writeFileSync(
      join(nested, 'deep.md'),
      ['# Deep Page', '', 'Go [up to the guide](../guide.md).', ''].join('\n')
    );
  });

  afterAll(() => {
    // Guarded cleanup: never throw if the dir is already gone.
    if (docsDir) {
      rmSync(docsDir, { recursive: true, force: true });
    }
  });

  describe('extractLinks', () => {
    it('discovers links across multiple markdown files (including nested dirs)', async () => {
      const links = await extractLinks(configFor(docsDir));
      const urls = links.map((l) => l.url);

      // From index.md
      expect(urls).toContain('./guide.md');
      expect(urls).toContain('./guide');
      expect(urls).toContain('./does-not-exist.md');
      expect(urls).toContain('https://example.com');
      // From guide.md
      expect(urls).toContain('./index.md#getting-started');
      // From anchors.md
      expect(urls).toContain('#installation-guide');
      // From the nested file -> proves recursive glob discovery
      expect(urls).toContain('../guide.md');
    });

    it('captures link metadata (text, type, source file, line number)', async () => {
      const links = await extractLinks(configFor(docsDir));

      const guideLink = links.find((l) => l.url === './guide.md') as DocumentLink;
      expect(guideLink).toBeDefined();
      expect(guideLink.text).toBe('guide');
      expect(guideLink.type).toBe('link');
      // filePath is absolute and points at the source file.
      expect(guideLink.filePath.endsWith('index.md')).toBe(true);
      expect(guideLink.lineNumber).toBeGreaterThan(0);
    });

    it('classifies images with type "image"', async () => {
      const links = await extractLinks(configFor(docsDir));
      const image = links.find((l) => l.url === './missing-image.png') as DocumentLink;
      expect(image).toBeDefined();
      expect(image.type).toBe('image');
    });

    it('returns an empty array for a directory with no markdown files', async () => {
      const emptyDir = mkdtempSync(join(tmpdir(), 'link-checker-empty-'));
      try {
        const links = await extractLinks(configFor(emptyDir));
        expect(links).toEqual([]);
      } finally {
        rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('checkLinks (checkExternal: false)', () => {
    it('marks an existing internal file link as valid', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      expect(resultForUrl(results, './guide.md').status).toBe('valid');
      // Extensionless link resolves by appending .md -> also valid.
      expect(resultForUrl(results, './guide').status).toBe('valid');
    });

    it('marks a link to a non-existent file as broken with a helpful error', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      const broken = resultForUrl(results, './does-not-exist.md');
      expect(broken.status).toBe('broken');
      expect(broken.error).toMatch(/not found/i);
    });

    it('validates a same-file anchor against an existing heading', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      // "## Installation Guide" -> slug "installation-guide", linked from the
      // same file (anchors.md), so it resolves.
      expect(resultForUrl(results, '#installation-guide').status).toBe('valid');
    });

    it('flags a same-file anchor with no matching heading as broken', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      const broken = resultForUrl(results, '#ghost-section');
      expect(broken.status).toBe('broken');
      expect(broken.error).toMatch(/anchor/i);
    });

    it('validates a cross-file anchor that targets an existing heading', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      // guide.md -> "./index.md#getting-started"; index.md has "# Getting Started".
      expect(resultForUrl(results, './index.md#getting-started').status).toBe('valid');
    });

    it('flags a cross-file anchor whose target heading is missing as broken', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      const broken = resultForUrl(results, './index.md#no-such-heading');
      expect(broken.status).toBe('broken');
      expect(broken.error).toMatch(/anchor/i);
    });

    it('does not perform any network checks for external links when disabled', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));

      // With checkExternal:false, external links are filtered out entirely and
      // never appear in results -> a strong guarantee that no fetch happened.
      const externalResult = results.find((r) => r.link.url === 'https://example.com');
      expect(externalResult).toBeUndefined();
      expect(results.every((r) => !/^https?:\/\//.test(r.link.url))).toBe(true);
    });

    it('returns no results when there are no links to check', async () => {
      const results = await checkLinks([], configFor(docsDir));
      expect(results).toEqual([]);
    });
  });

  describe('generateReport', () => {
    it('summarizes counts of valid, broken, and warning results', () => {
      const link = (url: string): DocumentLink => ({
        url,
        text: url,
        filePath: '/fake/file.md',
        type: 'link',
      });
      const results: LinkCheckResult[] = [
        { link: link('a'), status: 'valid' },
        { link: link('b'), status: 'valid' },
        { link: link('c'), status: 'broken' },
        { link: link('d'), status: 'warning' },
      ];

      expect(generateReport(results)).toEqual({
        total: 4,
        valid: 2,
        broken: 1,
        warnings: 1,
      });
    });

    it('returns all-zero counts for an empty result set', () => {
      expect(generateReport([])).toEqual({
        total: 0,
        valid: 0,
        broken: 0,
        warnings: 0,
      });
    });

    it('reflects the real results produced by checkLinks over the fixtures', async () => {
      const links = await extractLinks(configFor(docsDir));
      const results = await checkLinks(links, configFor(docsDir));
      const report = generateReport(results);

      // Internal report invariants (independent of exact fixture counts):
      // every result is accounted for, and the buckets sum to the total.
      expect(report.total).toBe(results.length);
      expect(report.valid + report.broken + report.warnings).toBe(report.total);
      // Our fixtures intentionally include both passing and failing links.
      expect(report.valid).toBeGreaterThan(0);
      expect(report.broken).toBeGreaterThan(0);
    });
  });
});
