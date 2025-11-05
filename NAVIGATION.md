# Navigation Builder

Auto-generate navigation structure from markdown files with frontmatter.

## Overview

The navigation builder utility parses markdown files with YAML frontmatter and generates a structured navigation tree suitable for `DocsSidebar`.

**Architecture:**
- Utility lives in `@goobits/docs-engine`
- Your app reads the filesystem
- Your app calls the utility with file content
- Utility returns `DocsSection[]` for `DocsSidebar`

## Frontmatter Schema

```yaml
---
title: Quick Start          # Page title (optional, derived from filename if missing)
description: Get started    # Short description (optional, extracted from first paragraph if missing)
section: Getting Started    # Section to group under (optional, defaults to "Documentation")
order: 1                    # Sort order within section (optional, defaults to 999)
icon: rocket                # Icon name for section (optional)
hidden: false               # Hide from navigation (optional)
---
```

## Usage Example

### 1. Create Docs with Frontmatter

```markdown
<!-- /workspace/docs/quick-start.md -->
---
title: Quick Start
description: Get up and running with AgentFlow in 5 minutes
section: Getting Started
order: 1
---

# Quick Start

Your content here...
```

```markdown
<!-- /workspace/docs/dsl/fundamentals.md -->
---
title: DSL Fundamentals
description: Learn the core concepts of AgentFlow DSL
section: DSL Language
order: 1
---

# DSL Fundamentals

Your content here...
```

### 2. Build Navigation in Your App

```typescript
// src/routes/docs/+layout.server.ts
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { buildNavigation, createDocFile } from '@goobits/docs-engine/utils';

export const load = async () => {
  // Read markdown files
  const files = readdirSync('docs')
    .filter(f => f.endsWith('.md'))
    .map(path => {
      const content = readFileSync(join('docs', path), 'utf-8');
      return createDocFile({ path, content, basePath: '/docs' });
    });

  // Build navigation
  const navigation = buildNavigation(files);

  return { navigation };
};
```

**For nested directories and custom icons**, see the complete example in the API Reference section below.

### 3. Use Navigation in Layout

```svelte
<!-- web/src/routes/docs/+layout.svelte -->
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

<style>
  .docs-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .docs-content {
    min-width: 0; /* Prevent overflow */
  }
</style>
```

## API Reference

### `buildNavigation(files, options)`

Builds navigation structure from document files.

**Parameters:**
- `files` (DocFile[]) - Array of document files with path, content, and href
- `options` (NavigationBuilderOptions, optional) - Configuration options
  - `icons` (Record<string, Component>) - Icon components for sections
  - `defaultSection` (string) - Default section name (default: "Documentation")

**Returns:** DocsSection[]

### `createDocFile(params)`

Helper to create DocFile objects.

**Parameters:**
- `path` (string) - Relative path from docs root
- `content` (string) - Markdown content with frontmatter
- `basePath` (string, default: "/docs") - Base URL path

**Returns:** DocFile

### `extractFrontmatter(content)`

Parse YAML frontmatter from markdown.

**Parameters:**
- `content` (string) - Markdown content with frontmatter

**Returns:** { frontmatter: DocFrontmatter, body: string }

## Complete Example

Full implementation with recursive directory scanning and custom icons:

```typescript
// src/routes/docs/+layout.server.ts
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { buildNavigation, createDocFile } from '@goobits/docs-engine/utils';
import { BookOpen, Code, Zap, FileText } from 'lucide-svelte';

const DOCS_ROOT = '/workspace/docs';
const BASE_PATH = '/docs';

const SECTION_ICONS = {
  'Getting Started': BookOpen,
  'DSL Language': Code,
  'Orchestration': Zap,
  'Reference': FileText,
};

function scanDocsDirectory(dir: string, relativePath = ''): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const relPath = relativePath ? `${relativePath}/${item}` : item;

    if (statSync(fullPath).isDirectory()) {
      files.push(...scanDocsDirectory(fullPath, relPath));
    } else if (item.endsWith('.md')) {
      files.push(relPath);
    }
  }

  return files;
}

export const load = async () => {
  const mdFiles = scanDocsDirectory(DOCS_ROOT);

  const docFiles = mdFiles.map((path) => {
    const content = readFileSync(join(DOCS_ROOT, path), 'utf-8');
    return createDocFile({ path, content, basePath: BASE_PATH });
  });

  const navigation = buildNavigation(docFiles, {
    icons: SECTION_ICONS,
    defaultSection: 'Documentation',
  });

  return { navigation };
};
```

## Custom Sorting

The navigation builder sorts sections and links automatically:

1. **Links within sections:** Sorted by `order` field (ascending)
2. **Sections:** Sorted by the minimum `order` of their links

Example:

```yaml
# docs/quick-start.md
---
section: Getting Started
order: 1
---
```

```yaml
# docs/installation.md
---
section: Getting Started
order: 2
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

## Fallback Behavior

If frontmatter is missing:

- **Title:** Generated from filename (`quick-start.md` → `"Quick Start"`)
- **Description:** Extracted from first paragraph of content
- **Section:** Uses `defaultSection` option (default: `"Documentation"`)
- **Order:** Defaults to `999` (appears at end)

## Hidden Pages

Mark pages as `hidden: true` to exclude from navigation:

```yaml
---
title: Draft Page
hidden: true
---
```

This is useful for work-in-progress docs that exist in the repo but shouldn't be shown yet.

## Previous/Next Navigation

Enhance reading flow with automatic sequential navigation links at the bottom of each documentation page.

### Overview

The `DocsPrevNext` component displays clickable cards linking to the previous and next pages based on sidebar navigation order. This encourages users to explore content sequentially without returning to the sidebar.

### Features

- **Automatic Ordering** - Uses navigation structure to determine sequence
- **Section-Aware** - Shows which section each link belongs to
- **Responsive Design** - Stacks vertically on mobile devices
- **Keyboard Accessible** - Full keyboard navigation support
- **Elegant Styling** - Hover effects and smooth transitions

### Usage

#### 1. Add to Your Layout

```svelte
<!-- src/routes/docs/[...path]/+page.svelte -->
<script lang="ts">
  import { DocsPrevNext } from '@goobits/docs-engine/components';
  import { getAdjacentLinks } from '@goobits/docs-engine/utils';

  export let data;

  const { previous, next } = getAdjacentLinks(
    data.navigation,
    $page.url.pathname
  );
</script>

<article>
  {@html data.content}
</article>

<DocsPrevNext {previous} {next} />
```

#### 2. Using DocsLayout Component

The `DocsLayout` component includes `DocsPrevNext` automatically:

```svelte
<script lang="ts">
  import { DocsLayout } from '@goobits/docs-engine/components';

  export let data;
</script>

<DocsLayout
  navigation={data.navigation}
  content={data.content}
  frontmatter={data.frontmatter}
  currentPath={$page.url.pathname}
/>
```

### API

#### `getAdjacentLinks(navigation, currentHref)`

Utility function to find previous and next links for a given page.

**Parameters:**
- `navigation` (DocsSection[]) - Navigation structure from `buildNavigation()`
- `currentHref` (string) - Current page path (e.g., `/docs/quick-start`)

**Returns:**
```typescript
{
  previous?: DocsLink & { section: string };
  next?: DocsLink & { section: string };
}
```

**Example:**
```typescript
import { getAdjacentLinks } from '@goobits/docs-engine/utils';

const { previous, next } = getAdjacentLinks(navigation, '/docs/quick-start');

// previous = { title: 'Installation', href: '/docs/installation', section: 'Getting Started' }
// next = { title: 'Configuration', href: '/docs/configuration', section: 'Getting Started' }
```

### Customization

#### Disable for Specific Pages

Use frontmatter to disable prev/next navigation:

```yaml
---
title: Standalone Page
showPrevNext: false
---
```

Then check in your layout:

```svelte
{#if data.frontmatter.showPrevNext !== false}
  <DocsPrevNext {previous} {next} />
{/if}
```

#### Styling

Customize with CSS variables:

```css
:root {
  --docs-prev-next-bg: rgba(255, 255, 255, 0.03);
  --docs-prev-next-border: rgba(255, 255, 255, 0.06);
  --docs-prev-next-hover-bg: rgba(255, 255, 255, 0.08);
  --docs-accent: #bd93f9;
}
```

### Example Output

```
┌─────────────────────────────────────────────────────────────┐
│ ← Previous                          Next →                   │
│ Installation                        Configuration            │
│ Install docs-engine                 Configure your project   │
│ Getting Started                     Getting Started          │
└─────────────────────────────────────────────────────────────┘
```

### Best Practices

**Do:**
- Keep page titles concise (< 40 characters)
- Use descriptive page descriptions
- Maintain logical ordering with `order` frontmatter

**Don't:**
- Mix unrelated sections in sequential navigation
- Rely solely on prev/next for navigation (keep sidebar)
- Use overly technical titles (keep them user-friendly)

### Related

- [DocsSidebar Component](#) - Primary navigation
- [DocsLayout Component](#) - Complete layout with sidebar and prev/next
- [Navigation Utilities](./docs/EXAMPLES.md) - Additional navigation helpers
