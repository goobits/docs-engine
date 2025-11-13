---
title: Navigation Utilities
description: Build and manage documentation navigation structures from markdown files
section: Utilities
difficulty: intermediate
tags: [utility, navigation, frontmatter, sidebar, filesystem]
---

# Navigation Utilities

A comprehensive suite of utilities for building, scanning, and managing documentation navigation structures from markdown files with frontmatter.

## Overview

The navigation utilities provide three complementary modules:

1. **Navigation Builder** - Parse frontmatter and build navigation trees
2. **Navigation Scanner** - Scan filesystem for markdown files
3. **Navigation Helpers** - Query and manipulate navigation structures

These are **utilities**, not remark/rehype plugins. They work with data structures and file systems, not markdown AST transformation.

**Architecture:**
- Utilities live in `@goobits/docs-engine/utils` (browser-safe)
- Scanner lives in `@goobits/docs-engine/server` (requires Node.js)
- Your app reads the filesystem (server-side)
- Your app calls utilities with file content
- Utilities return `DocsSection[]` for `DocsSidebar` component

---

## Module 1: Navigation Builder

Build structured navigation from markdown files with frontmatter.

### Frontmatter Schema

```yaml
---
title: Quick Start          # Page title (optional, derived from filename if missing)
description: Get started    # Short description (optional)
section: Getting Started    # Section to group under (optional, defaults to "Documentation")
order: 1                    # Sort order within section (optional, defaults to 999)
icon: rocket                # Icon name for section (optional)
hidden: false               # Hide from navigation (optional)
audience: developer         # Target audience filter (optional)
---
```

### Quick Start Example

#### 1. Create Docs with Frontmatter

```markdown
<!-- /docs/quick-start.md -->
---
title: Quick Start
description: Get up and running in 5 minutes
section: Getting Started
order: 1
---

# Quick Start

Your content here...
```

#### 2. Build Navigation in Your App

```typescript
// src/routes/docs/+layout.server.ts
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { buildNavigation, createDocFile } from '@goobits/docs-engine/utils';
import { BookOpen, Code } from 'lucide-svelte';

export const load = async () => {
  // Read markdown files
  const files = readdirSync('docs')
    .filter(f => f.endsWith('.md'))
    .map(path => {
      const content = readFileSync(join('docs', path), 'utf-8');
      return createDocFile({ path, content, basePath: '/docs' });
    });

  // Build navigation
  const navigation = buildNavigation(files, {
    icons: {
      'Getting Started': BookOpen,
      'API Reference': Code
    }
  });

  return { navigation };
};
```

#### 3. Use Navigation in Layout

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { DocsSidebar } from '@goobits/docs-engine/components';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<div class="docs-layout">
  <DocsSidebar
    navigation={data.navigation}
    currentPath={$page.url.pathname}
  />

  <main class="docs-content">
    <slot />
  </main>
</div>
```

### API Reference

#### `buildNavigation(files, options)`

Builds navigation structure from document files.

**Parameters:**
- `files` ([DocFile](#docfile)[]) - Array of document files with path, content, and href
- `options` ([NavigationBuilderOptions](#navigationbuilderoptions), optional) - Configuration options

**Returns:** [DocsSection](#docssection)[]

**Example:**
```typescript
import { buildNavigation } from '@goobits/docs-engine/utils';
import { BookOpen, Code } from 'lucide-svelte';

const files = [
  {
    path: 'quick-start.md',
    content: '---\ntitle: Quick Start\nsection: Getting Started\n---\n...',
    href: '/docs/quick-start'
  }
];

const navigation = buildNavigation(files, {
  icons: {
    'Getting Started': BookOpen,
    'DSL': Code
  },
  defaultSection: 'Documentation',
  defaultSectionDescription: 'All documentation pages'
});
```

#### `createDocFile(params)`

Helper to create DocFile objects from filesystem reads.

**Parameters:**
- `path` (string) - Relative path from docs root (e.g., "quick-start.md")
- `content` (string) - Markdown content with frontmatter
- `basePath` (string, default: "/docs") - Base URL path

**Returns:** [DocFile](#docfile)

**Example:**
```typescript
import { createDocFile } from '@goobits/docs-engine/utils';
import { readFileSync } from 'fs';

const docFile = createDocFile({
  path: 'guides/setup.md',
  content: readFileSync('/workspace/docs/guides/setup.md', 'utf-8'),
  basePath: '/docs'
});

// Result:
// {
//   path: 'guides/setup.md',
//   content: '---\ntitle: Setup Guide\n---\n...',
//   href: '/docs/guides/setup'
// }
```

#### `extractFrontmatter(content)`

Extract YAML frontmatter from markdown content.

**Parameters:**
- `content` (string) - Markdown content with frontmatter

**Returns:**
- `frontmatter` ([DocFrontmatter](#docfrontmatter)) - Parsed frontmatter object
- `body` (string) - Markdown content without frontmatter

**Example:**
```typescript
import { extractFrontmatter } from '@goobits/docs-engine/utils';

const { frontmatter, body } = extractFrontmatter(`---
title: API Guide
section: Reference
order: 10
---

# API Guide

Content here...
`);

console.log(frontmatter);
// { title: 'API Guide', section: 'Reference', order: 10 }

console.log(body);
// "\n# API Guide\n\nContent here...\n"
```

### Type Definitions

#### DocFile
```typescript
interface DocFile {
  /** Relative path from docs root (e.g., "quick-start.md" or "dsl/fundamentals.md") */
  path: string;
  /** Full markdown content including frontmatter */
  content: string;
  /** URL href (e.g., "/docs/quick-start") */
  href: string;
}
```

#### DocFrontmatter
```typescript
interface DocFrontmatter {
  title?: string;
  description?: string;
  order?: number;
  section?: string;
  icon?: string;
  hidden?: boolean;
  audience?: string;
}
```

#### NavigationBuilderOptions
```typescript
interface NavigationBuilderOptions {
  /** Base URL path (default: "/docs") */
  basePath?: string;
  /** Icon components map */
  icons?: Record<string, ComponentType>;
  /** Default icon if none specified */
  defaultIcon?: ComponentType;
  /** Default section name for ungrouped docs */
  defaultSection?: string;
  /** Default section description */
  defaultSectionDescription?: string;
}
```

#### DocsSection
```typescript
interface DocsSection {
  title: string;
  description: string;
  icon: ComponentType;
  links: DocsLink[];
}
```

#### DocsLink
```typescript
interface DocsLink {
  title: string;
  href: string;
  description: string;
  audience?: string;
}
```

### Sorting Behavior

The navigation builder automatically sorts sections and links:

1. **Links within sections:** Sorted by `order` field (ascending)
2. **Sections:** Sorted by the minimum `order` of their links

**Example:**

```yaml
# docs/quick-start.md
---
section: Getting Started
order: 1
---
```

```yaml
# docs/dsl/fundamentals.md
---
section: DSL Language
order: 10
---
```

This produces sections in order: "Getting Started" (min order: 1), then "DSL Language" (min order: 10).

### Fallback Behavior

If frontmatter is missing:

- **Title:** Generated from filename (`quick-start.md` → `"Quick Start"`)
- **Description:** Extracted from first paragraph of content
- **Section:** Uses `defaultSection` option (default: `"Documentation"`)
- **Order:** Defaults to `999` (appears at end)

### Hidden Pages

Mark pages as `hidden: true` to exclude from navigation:

```yaml
---
title: Draft Page
hidden: true
---
```

Useful for work-in-progress docs in the repo that shouldn't be shown yet.

### Audience Filtering

Tag pages with audiences and filter at runtime:

```yaml
---
title: Advanced API
audience: developer
---
```

```typescript
// Filter links by audience in your app
const devNavigation = navigation.map(section => ({
  ...section,
  links: section.links.filter(link =>
    !link.audience || link.audience === 'developer'
  )
}));
```

---

## Module 2: Navigation Scanner

Scan filesystem directories to find markdown files (server-side only).

### API Reference

#### `scanDocumentation(options)`

Scan a directory and create DocFile objects for navigation building.

**Parameters:**
- `options` ([ScanOptions](#scanoptions)) - Scan configuration

**Returns:** Promise<[DocFile](#docfile)[]>

**Example:**
```typescript
// Server-side only (requires Node.js fs/promises)
import { scanDocumentation } from '@goobits/docs-engine/server';
import { buildNavigation } from '@goobits/docs-engine/utils';

const files = await scanDocumentation({
  docsRoot: '/workspace/docs',
  basePath: '/docs',
  exclude: (path) => path.includes('README') || path.startsWith('meta/')
});

const navigation = buildNavigation(files, {
  icons: { 'Getting Started': RocketIcon }
});
```

#### `findMarkdownFiles(dir, baseDir?)`

Recursively find all markdown files in a directory.

**Parameters:**
- `dir` (string) - Directory to scan
- `baseDir` (string, optional) - Base directory for relative path calculation (defaults to `dir`)

**Returns:** Promise<string[]>

**Example:**
```typescript
import { findMarkdownFiles } from '@goobits/docs-engine/server';

const files = await findMarkdownFiles('/workspace/docs');
// Returns: ['quick-start.md', 'guides/setup.md', 'api/reference.md', ...]
```

#### `pathToHref(filePath, basePath?)`

Convert file path to URL href.

**Parameters:**
- `filePath` (string) - Relative file path (e.g., "guides/setup.md")
- `basePath` (string, default: "/docs") - Base URL path

**Returns:** string

**Example:**
```typescript
import { pathToHref } from '@goobits/docs-engine/server';

pathToHref('quick-start.md', '/docs');        // "/docs/quick-start"
pathToHref('guides/setup.md', '/docs');       // "/docs/guides/setup"
pathToHref('api/v2/auth.md', '/reference');   // "/reference/api/v2/auth"
```

### Type Definitions

#### ScanOptions
```typescript
interface ScanOptions {
  /** Root directory to scan */
  docsRoot: string;
  /** Base URL path for hrefs (default: "/docs") */
  basePath?: string;
  /** File patterns to exclude */
  exclude?: (path: string) => boolean;
}
```

### Complete Example: Auto-Scanning Navigation

```typescript
// src/routes/docs/+layout.server.ts (SvelteKit example)
import { scanDocumentation } from '@goobits/docs-engine/server';
import { buildNavigation } from '@goobits/docs-engine/utils';
import { BookOpen, Code, Rocket } from 'lucide-svelte';

export const load = async () => {
  // Automatically scan /docs directory
  const files = await scanDocumentation({
    docsRoot: './docs',
    basePath: '/docs',
    exclude: (path) =>
      path.includes('README') ||
      path.includes('CHANGELOG') ||
      path.startsWith('.')
  });

  // Build navigation with icons
  const navigation = buildNavigation(files, {
    icons: {
      'Getting Started': Rocket,
      'Guides': BookOpen,
      'API Reference': Code
    },
    defaultSection: 'Documentation',
    defaultSectionDescription: 'All documentation pages'
  });

  return { navigation };
};
```

---

## Module 3: Navigation Helpers

Query and manipulate existing navigation structures.

### API Reference

#### `getAllLinks(navigation)`

Get all links from navigation structure flattened with section info.

**Parameters:**
- `navigation` ([DocsSection](#docssection)[]) - Array of documentation sections

**Returns:** Array<[DocsLink](#docslink) & { section: string }>

**Example:**
```typescript
import { getAllLinks } from '@goobits/docs-engine/utils';

const allLinks = getAllLinks(navigation);
// [
//   { title: 'Quick Start', href: '/docs/quick-start', section: 'Getting Started', ... },
//   { title: 'Installation', href: '/docs/install', section: 'Getting Started', ... },
//   { title: 'API Reference', href: '/docs/api', section: 'Reference', ... }
// ]
```

#### `findLinkByHref(navigation, href)`

Find a link by its href path.

**Parameters:**
- `navigation` ([DocsSection](#docssection)[]) - Array of documentation sections
- `href` (string) - The href to search for

**Returns:** ([DocsLink](#docslink) & { section: string }) | undefined

**Example:**
```typescript
import { findLinkByHref } from '@goobits/docs-engine/utils';

const link = findLinkByHref(navigation, '/docs/quick-start');
// {
//   title: 'Quick Start',
//   href: '/docs/quick-start',
//   description: 'Get up and running in 5 minutes',
//   section: 'Getting Started'
// }
```

#### `getSectionByTitle(navigation, title)`

Get a section by its title.

**Parameters:**
- `navigation` ([DocsSection](#docssection)[]) - Array of documentation sections
- `title` (string) - The section title to search for

**Returns:** [DocsSection](#docssection) | undefined

**Example:**
```typescript
import { getSectionByTitle } from '@goobits/docs-engine/utils';

const section = getSectionByTitle(navigation, 'Getting Started');
// {
//   title: 'Getting Started',
//   description: 'Getting Started documentation',
//   icon: RocketIcon,
//   links: [...]
// }
```

#### `getAdjacentLinks(navigation, currentHref, filterAudiences?)`

Get next and previous links for a given href (for pagination).

**Parameters:**
- `navigation` ([DocsSection](#docssection)[]) - Array of documentation sections
- `currentHref` (string) - The current page's href
- `filterAudiences` (Set<string>, optional) - Optional set of audiences to filter by

**Returns:** { previous?: [DocsLink](#docslink) & { section: string }, next?: [DocsLink](#docslink) & { section: string } }

**Example:**
```typescript
import { getAdjacentLinks } from '@goobits/docs-engine/utils';

const { previous, next } = getAdjacentLinks(navigation, '/docs/installation');
// {
//   previous: { title: 'Quick Start', href: '/docs/quick-start', section: 'Getting Started', ... },
//   next: { title: 'Configuration', href: '/docs/config', section: 'Getting Started', ... }
// }

// With audience filtering
const { previous, next } = getAdjacentLinks(
  navigation,
  '/docs/api',
  new Set(['developer'])
);
// Only includes links with audience='developer' or no audience set
```

### Example: Prev/Next Page Navigation

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { getAdjacentLinks } from '@goobits/docs-engine/utils';

  export let navigation;

  $: ({ previous, next } = getAdjacentLinks(navigation, $page.url.pathname));
</script>

<nav class="page-navigation">
  {#if previous}
    <a href={previous.href} class="prev">
      ← {previous.title}
      <span class="section">{previous.section}</span>
    </a>
  {/if}

  {#if next}
    <a href={next.href} class="next">
      {next.title} →
      <span class="section">{next.section}</span>
    </a>
  {/if}
</nav>
```

### Example: Breadcrumb Navigation

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { findLinkByHref } from '@goobits/docs-engine/utils';

  export let navigation;

  $: currentLink = findLinkByHref(navigation, $page.url.pathname);
</script>

{#if currentLink}
  <nav class="breadcrumbs">
    <a href="/docs">Documentation</a>
    <span class="separator">/</span>
    <a href="#section">{currentLink.section}</a>
    <span class="separator">/</span>
    <span class="current">{currentLink.title}</span>
  </nav>
{/if}
```

---

## Complete Working Example

Here's a full example combining all three modules:

```typescript
// src/routes/docs/+layout.server.ts
import { scanDocumentation } from '@goobits/docs-engine/server';
import { buildNavigation } from '@goobits/docs-engine/utils';
import { BookOpen, Code, Rocket, Zap } from 'lucide-svelte';

export const load = async () => {
  // 1. Scan filesystem for markdown files
  const files = await scanDocumentation({
    docsRoot: './docs',
    basePath: '/docs',
    exclude: (path) => path.includes('README')
  });

  // 2. Build navigation structure
  const navigation = buildNavigation(files, {
    icons: {
      'Getting Started': Rocket,
      'Guides': BookOpen,
      'API Reference': Code,
      'Advanced': Zap
    },
    defaultSection: 'Documentation'
  });

  return { navigation };
};
```

```svelte
<!-- src/routes/docs/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { DocsSidebar } from '@goobits/docs-engine/components';
  import { getAdjacentLinks, findLinkByHref } from '@goobits/docs-engine/utils';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  // 3. Use navigation helpers
  $: currentLink = findLinkByHref(data.navigation, $page.url.pathname);
  $: ({ previous, next } = getAdjacentLinks(data.navigation, $page.url.pathname));
</script>

<div class="docs-layout">
  <aside>
    <DocsSidebar
      navigation={data.navigation}
      currentPath={$page.url.pathname}
    />
  </aside>

  <main>
    <!-- Breadcrumbs -->
    {#if currentLink}
      <nav class="breadcrumbs">
        <a href="/docs">Docs</a> /
        <a href="#section">{currentLink.section}</a> /
        <span>{currentLink.title}</span>
      </nav>
    {/if}

    <!-- Page content -->
    <slot />

    <!-- Prev/Next navigation -->
    <nav class="page-nav">
      {#if previous}
        <a href={previous.href}>← {previous.title}</a>
      {/if}
      {#if next}
        <a href={next.href}>{next.title} →</a>
      {/if}
    </nav>
  </main>
</div>
```

---

## Plugin vs Utility: Why This Matters

**These are utilities, NOT remark/rehype plugins:**

- **Plugins** transform markdown AST (used with `.use()` in unified pipeline)
- **Utilities** work with data structures, file systems, and content

**What navigation utilities do:**
- ✅ Parse frontmatter from markdown strings
- ✅ Build data structures for navigation
- ✅ Query and filter navigation structures
- ✅ Scan filesystem for markdown files

**What they don't do:**
- ❌ Transform markdown AST
- ❌ Integrate with remark/rehype pipelines
- ❌ Process markdown during rendering

---

## Performance Considerations

### Complexity
- `buildNavigation()`: O(n log n) where n = number of files
- `getAllLinks()`: O(n) where n = total links
- `findLinkByHref()`: O(n) linear search
- `getAdjacentLinks()`: O(n) linear search

### Optimization Tips

1. **Build navigation once** (server-side at build time or request time)
2. **Cache the result** (don't rebuild on every page load)
3. **Use audience filtering sparingly** (adds O(n) filter operation)
4. **Consider memoization** for frequently accessed data

**Example: SvelteKit caching**

```typescript
// src/routes/docs/+layout.server.ts
import { dev } from '$app/environment';

let cachedNavigation: DocsSection[] | null = null;

export const load = async () => {
  // Cache in production, rebuild in dev
  if (!dev && cachedNavigation) {
    return { navigation: cachedNavigation };
  }

  const files = await scanDocumentation({ docsRoot: './docs' });
  const navigation = buildNavigation(files);

  if (!dev) {
    cachedNavigation = navigation;
  }

  return { navigation };
};
```

---

## Related Documentation

**Prerequisites:**
- Basic YAML knowledge
- Markdown familiarity
- SvelteKit or similar framework

**Next Steps:**
- [Frontmatter Parser](./frontmatter.md) - Parse YAML frontmatter
- [DocsSidebar Component](../components/docs-sidebar.md) - Display navigation

**Related:**
- [Getting Started](../getting-started.md) - Quick start guide
- [File I/O Utilities](../reference/file-io.md) - Filesystem operations
