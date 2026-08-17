---
title: Getting Started
description: Scaffold a docs site or add Docs Engine to an existing SvelteKit app
section: Getting Started
difficulty: beginner
tags: [quickstart, setup, installation]
---

# Getting Started

Docs Engine supports two setup paths. Scaffold a standalone site for the quickest start, or add the shared adapter to an existing SvelteKit app.

## Scaffold a site

Prerequisites: Node.js 20 or newer and pnpm, npm, or Yarn.

```bash
pnpm dlx --package @goobits/docs-engine-cli create-docs-engine my-docs
cd my-docs
pnpm dev
```

The generated project includes:

- a `docs/` Markdown directory with sample pages
- `/docs` and `/docs/[...slug]` routes
- generated sidebar navigation and search data
- the shared `DocsLayout` component and styles
- `check`, `check-links`, and `build` scripts

Useful non-interactive options:

```bash
create-docs-engine my-docs --yes --package-manager pnpm --no-install
```

Use `--force` only when you intentionally want to replace an existing project directory.

## Add to an existing SvelteKit app

### 1. Install

```bash
pnpm add @goobits/docs-engine @lucide/svelte
```

Install `mermaid` too if your Markdown uses Mermaid diagrams:

```bash
pnpm add mermaid
```

### 2. Add Markdown

Create `docs/index.md`:

```markdown
---
title: Documentation
description: Project documentation
section: Getting Started
order: 1
---

# Documentation

Welcome to the project documentation.
```

### 3. Create the docs adapter

Create `src/routes/docs/_docsData.server.ts`:

```ts
import { error } from '@sveltejs/kit';
import {
  createDocsLayoutLoad,
  createDocsPageLoad,
  createDocsSearchHandler,
  createSvelteKitDocs,
  type MarkdownModuleLoader,
} from '@goobits/docs-engine/sveltekit';

const modules = import.meta.glob('../../../docs/**/*.md', {
  import: 'default',
  query: '?raw',
}) as Record<string, MarkdownModuleLoader>;

const docs = createSvelteKitDocs({
  modules,
  config: {
    routePrefix: '/docs',
    screenshots: { enabled: false },
  },
});

export const loadDocsLayout = createDocsLayoutLoad(docs);
export const loadDocsPage = createDocsPageLoad(docs, error);
export const getDocsSearch = createDocsSearchHandler(docs);
```

`createDocsPageLoad` accepts the host app's `error` function so the adapter uses the same SvelteKit runtime instance as the app.

### 4. Add thin route handlers

`src/routes/docs/+layout.server.ts`:

```ts
import { loadDocsLayout } from './_docsData.server';

export const load = loadDocsLayout;
```

`src/routes/docs/+page.server.ts`:

```ts
import { loadDocsPage } from './_docsData.server';

export const load = loadDocsPage;
```

`src/routes/docs/[...slug]/+page.server.ts`:

```ts
import { loadDocsPage } from '../_docsData.server';

export const load = loadDocsPage;
```

`src/routes/docs/search-index.json/+server.ts`:

```ts
import { getDocsSearch } from '../_docsData.server';

export const prerender = true;
export const GET = getDocsSearch;
```

### 5. Render page data

Create one shared page component and use it from both page routes:

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { DocsLayout } from '@goobits/docs-engine/components';
  import type { SvelteKitDocsLayoutData, SvelteKitDocsPage } from '@goobits/docs-engine/sveltekit';

  let { data }: { data: SvelteKitDocsPage & SvelteKitDocsLayoutData } = $props();
</script>

<DocsLayout
  content={data.content}
  title={data.title}
  navigation={data.navigation}
  currentPath={page.url.pathname}
  editLink={data.editLink}
  searchIndexUrl={data.searchIndexUrl}
/>
```

Import the shared styles once from your root stylesheet:

```css
@import '@goobits/docs-engine/styles';
```

## Configuration

Pass configuration to `createSvelteKitDocs`:

```ts
const docs = createSvelteKitDocs({
  modules,
  config: {
    routePrefix: '/docs',
    features: { search: true, editOnGithub: true },
    screenshots: { enabled: false },
    git: {
      repoUrl: 'https://github.com/acme/widgets',
      branch: 'main',
      docsPath: 'docs',
    },
  },
});
```

## Verify

```bash
pnpm check
pnpm check-links
pnpm build
```

Then confirm these routes:

- `/docs`
- `/docs/getting-started` for a matching Markdown file
- `/docs/search-index.json`
- an unknown `/docs/...` path returns 404

## Next steps

- [Architecture and ownership](./guides/architecture.md)
- [Plugin order](./guides/plugin-order.md)
- [API reference generation](./reference/api-generation.md)
- [Screenshots](./plugins/screenshots.md)
