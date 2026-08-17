import { describe, expect, it } from 'vitest';
import type { ApiSymbolMap } from '../reference.ts';
import {
  createDocsLayoutLoad,
  createDocsPageLoad,
  createDocsSearchHandler,
  createSvelteKitDocs,
} from './index.ts';

const symbols: ApiSymbolMap = {
  Widget: [
    {
      name: 'Widget',
      path: 'packages/widgets/src/Widget.ts',
      line: 4,
      kind: 'class',
      exported: true,
      signature: 'class Widget',
    },
  ],
};

function createFixture(): ReturnType<typeof createSvelteKitDocs> {
  return createSvelteKitDocs({
    modules: {
      '/content/index.md': async () => `---
title: Widget Docs
section: Start
order: 1
description: Widget overview
---
# Widget Docs

## TOC

## Overview

Use {@Widget}.
`,
      '/content/guides/install.md': async () => ({
        default: `---
title: Install
section: Guides
order: 2
---
# Install

Install the widget package.
`,
      }),
    },
    config: {
      routePrefix: '/handbook',
      screenshots: { enabled: false },
      features: { editOnGithub: true },
      git: {
        repoUrl: 'https://github.com/acme/widgets',
        branch: 'stable',
        docsPath: 'content',
      },
    },
    references: {
      symbols,
      repository: {
        url: 'https://github.com/acme/widgets',
        branch: 'stable',
      },
    },
  });
}

const httpError = (_status: 404, message: string): never => {
  throw new Error(message);
};

describe('createSvelteKitDocs', () => {
  it('loads and renders pages through the package renderer preset', async () => {
    const page = await createFixture().getPage('index');

    expect(page?.title).toBe('Widget Docs');
    expect(page?.href).toBe('/handbook');
    expect(page?.content).toContain('Table of Contents');
    expect(page?.content).toContain(
      'https://github.com/acme/widgets/blob/stable/packages/widgets/src/Widget.ts#L4'
    );
    expect(page?.editLink?.href).toBe(
      'https://github.com/acme/widgets/edit/stable/content/index.md'
    );
  });

  it('builds navigation and search from the same collection', async () => {
    const docs = createFixture();
    const layout = await docs.getLayoutData();
    const index = await docs.getSearchIndex();

    expect(layout.searchIndexUrl).toBe('/handbook/search-index.json');
    expect(layout.navigation.map((section) => section.title)).toEqual(['Start', 'Guides']);
    expect(index).toContain('/handbook/guides/install');
  });

  it('provides small SvelteKit-compatible loaders and response handlers', async () => {
    const docs = createFixture();
    const pageLoad = createDocsPageLoad(docs, httpError);
    const layoutLoad = createDocsLayoutLoad(docs);
    const searchHandler = createDocsSearchHandler(docs);

    await expect(pageLoad({ params: {} })).resolves.toMatchObject({ slug: 'index' });
    await expect(layoutLoad()).resolves.toMatchObject({
      searchIndexUrl: '/handbook/search-index.json',
    });
    const response = await searchHandler();
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.text()).toContain('/handbook');
  });

  it('returns null for an unknown collection entry', async () => {
    await expect(createFixture().getPage('missing')).resolves.toBeNull();
  });
});
