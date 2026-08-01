import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mergeConfig } from './config.js';
import { validateInternalLink, validateLinks } from './link-validator.js';
import { calculateStats } from './reporter.js';
import type { ExtractedLink, ValidationResult } from './_linkModels.js';

let docsDir: string;

function fixture(name: string, content: string): string {
  const filePath = join(docsDir, name);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function link(file: string, url: string): ExtractedLink {
  return {
    url,
    text: url,
    file,
    line: 1,
    type: 'link',
    isExternal: /^https?:\/\//i.test(url),
    isAnchor: url.startsWith('#'),
  };
}

beforeEach(() => {
  docsDir = mkdtempSync(join(tmpdir(), 'docs-engine-link-validator-'));
});

afterEach(() => {
  rmSync(docsDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('link validator', () => {
  it('accepts existing files with and without a markdown extension', () => {
    const source = fixture('index.md', '# Index');
    fixture('guide.md', '# Guide');
    const config = mergeConfig({ baseDir: docsDir });

    expect(validateInternalLink(link(source, './guide.md'), config).isValid).toBe(true);
    expect(validateInternalLink(link(source, './guide'), config).isValid).toBe(true);
  });

  it('reports a missing internal file', () => {
    const source = fixture('index.md', '# Index');
    const result = validateInternalLink(
      link(source, './missing.md'),
      mergeConfig({ baseDir: docsDir })
    );

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it('validates same-file anchors from the complete formatted heading text', () => {
    const source = fixture(
      'formatted.md',
      ['# Page', '', '## Install **now** please', '', '[Jump](#install-now-please)'].join('\n')
    );

    expect(
      validateInternalLink(link(source, '#install-now-please'), mergeConfig({ baseDir: docsDir }))
        .isValid
    ).toBe(true);
  });

  it('validates cross-file markdown and HTML anchors', () => {
    const source = fixture('index.md', '# Index');
    fixture(
      'guide.md',
      [
        '# Guide',
        '',
        '## Setup',
        '',
        '<section id="overview"></section>',
        '<a class="target" name="manual"></a>',
      ].join('\n')
    );
    const config = mergeConfig({ baseDir: docsDir });

    expect(validateInternalLink(link(source, './guide.md#setup'), config).isValid).toBe(true);
    expect(validateInternalLink(link(source, './guide.md#overview'), config).isValid).toBe(true);
    expect(validateInternalLink(link(source, './guide.md#manual'), config).isValid).toBe(true);
    expect(validateInternalLink(link(source, './guide.md#missing'), config).isValid).toBe(false);
  });

  it('resolves directory links through an index document', () => {
    const source = fixture('index.md', '# Index');
    const section = join(docsDir, 'section');
    mkdirSync(section);
    writeFileSync(join(section, 'index.md'), '# Section', 'utf-8');

    expect(
      validateInternalLink(link(source, './section'), mergeConfig({ baseDir: docsDir })).isValid
    ).toBe(true);
  });

  it('resolves root-relative assets from the configured public directory', () => {
    const source = fixture('index.md', '# Index');
    const publicDir = join(docsDir, 'public');
    mkdirSync(publicDir);
    writeFileSync(join(publicDir, 'logo.svg'), '<svg />', 'utf-8');

    expect(
      validateInternalLink(link(source, '/logo.svg'), mergeConfig({ baseDir: docsDir, publicDir }))
        .isValid
    ).toBe(true);
  });

  it('resolves root-relative document links from the configured route prefix', () => {
    const source = fixture('index.md', '# Index');
    fixture('guide.md', '# Guide');
    const config = mergeConfig({ baseDir: docsDir, routePrefix: '/docs' });

    expect(validateInternalLink(link(source, '/docs/guide'), config).isValid).toBe(true);
    expect(validateInternalLink(link(source, '/docs'), config).isValid).toBe(true);
  });

  it('does not request external links when external checking is disabled', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const source = fixture('index.md', '# Index');

    await expect(
      validateLinks(
        [link(source, 'https://example.com')],
        mergeConfig({ baseDir: docsDir, checkExternal: false })
      )
    ).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calculates report totals from canonical validation results', () => {
    const source = fixture('index.md', '# Index');
    const results: ValidationResult[] = [
      { link: link(source, './ok.md'), isValid: true },
      { link: link(source, './missing.md'), isValid: false, error: 'File not found' },
    ];

    expect(calculateStats(results)).toEqual({
      total: 2,
      valid: 1,
      broken: 1,
      external: 0,
      internal: 2,
    });
  });
});
