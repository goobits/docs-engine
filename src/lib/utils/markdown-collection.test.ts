import { describe, expect, it, vi } from 'vitest';
import { createMarkdownCollection } from './markdown-collection.ts';
import { extractNavigationMetadata } from './navigation-builder.ts';

const indexMarkdown = `---
title: Docs Home
hidden: true
---

# Docs Home

Welcome to the docs.
`;

const guideMarkdown = `---
title: Lazy Guide
description: Loaded only when requested.
section: Guides
order: 1
---

# Lazy Guide

The searchable guide body.
`;

function createFixture(): {
  collection: ReturnType<typeof createMarkdownCollection>;
  loadIndex: ReturnType<typeof vi.fn>;
  loadGuide: ReturnType<typeof vi.fn>;
} {
  const loadIndex = vi.fn(async () => indexMarkdown);
  const loadGuide = vi.fn(async () => guideMarkdown);
  const collection = createMarkdownCollection(
    {
      '/content/index.md': loadIndex,
      '/content/guides/lazy.md': loadGuide,
    },
    {
      basePath: '/docs',
      navigationMetadata: {
        '/content/index.md': extractNavigationMetadata(indexMarkdown),
        '/content/guides/lazy.md': extractNavigationMetadata(guideMarkdown),
      },
    }
  );
  return { collection, loadIndex, loadGuide };
}

describe('createMarkdownCollection', () => {
  it('builds compact navigation without loading markdown bodies', () => {
    const { collection, loadGuide, loadIndex } = createFixture();

    expect(collection.getNavigationData()).toEqual({
      navigation: [
        {
          title: 'Guides',
          description: 'Guides documentation',
          links: [
            {
              title: 'Lazy Guide',
              description: 'Loaded only when requested.',
              href: '/docs/guides/lazy',
            },
          ],
        },
      ],
    });
    expect(loadIndex).not.toHaveBeenCalled();
    expect(loadGuide).not.toHaveBeenCalled();
  });

  it('loads and memoizes only the requested slug', async () => {
    const { collection, loadGuide, loadIndex } = createFixture();

    await expect(collection.getBySlug('guides/lazy')).resolves.toMatchObject({
      slug: 'guides/lazy',
      href: '/docs/guides/lazy',
      content: guideMarkdown,
    });
    await collection.getBySlug('/guides/lazy.md');

    expect(loadGuide).toHaveBeenCalledOnce();
    expect(loadIndex).not.toHaveBeenCalled();
  });

  it('builds and memoizes the full search index only when requested', async () => {
    const { collection, loadGuide, loadIndex } = createFixture();

    const first = await collection.getSearchIndex();
    const second = await collection.getSearchIndex();

    expect(JSON.parse(first)).toMatchObject({ documentCount: 1 });
    expect(second).toBe(first);
    expect(loadIndex).toHaveBeenCalledOnce();
    expect(loadGuide).toHaveBeenCalledOnce();
  });

  it('fails closed when a body loader has no matching metadata', () => {
    expect(() =>
      createMarkdownCollection(
        { '/content/missing.md': async () => '# Missing' },
        { navigationMetadata: {} }
      )
    ).toThrow('Missing navigation metadata for /content/missing.md');
  });

  it('retries a body loader after a transient failure', async () => {
    const loadGuide = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary read failure'))
      .mockResolvedValueOnce(guideMarkdown);
    const collection = createMarkdownCollection(
      { '/content/guides/lazy.md': loadGuide },
      {
        navigationMetadata: {
          '/content/guides/lazy.md': extractNavigationMetadata(guideMarkdown),
        },
      }
    );

    await expect(collection.getBySlug('guides/lazy')).rejects.toThrow('temporary read failure');
    await expect(collection.getBySlug('guides/lazy')).resolves.toMatchObject({
      content: guideMarkdown,
    });
    expect(loadGuide).toHaveBeenCalledTimes(2);
  });

  it('retries search-index construction after a transient body failure', async () => {
    const loadGuide = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary index failure'))
      .mockResolvedValueOnce(guideMarkdown);
    const collection = createMarkdownCollection(
      { '/content/guides/lazy.md': loadGuide },
      {
        navigationMetadata: {
          '/content/guides/lazy.md': extractNavigationMetadata(guideMarkdown),
        },
      }
    );

    await expect(collection.getSearchIndex()).rejects.toThrow('temporary index failure');
    await expect(collection.getSearchIndex()).resolves.toContain('documentCount');
    expect(loadGuide).toHaveBeenCalledTimes(2);
  });
});
