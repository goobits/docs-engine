---
title: Navigation Builder
description: Auto-generate navigation structure from markdown files with frontmatter
section: Plugins
difficulty: beginner
tags: [plugin, navigation, frontmatter, sidebar]
---

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
description: Get started    # Short description (optional)
section: Getting Started    # Section to group under (optional, defaults to "Documentation")
order: 1                    # Sort order within section (optional, defaults to 999)
icon: rocket                # Icon name for section (optional)
hidden: false               # Hide from navigation (optional)
---
```

## Usage Example

### 1. Create Docs with Frontmatter

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

### 3. Use Navigation in Layout

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

---

## API Reference

### `buildNavigation(files, options)`

Builds navigation structure from document files.

**Parameters:**
- `files` ({@DocFile}[]) - Array of document files with path, content, and href
- `options` ({@NavigationBuilderOptions}, optional) - Configuration options
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

---

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
# docs/dsl/fundamentals.md
---
section: DSL Language
order: 10
---
```

This produces sections in order: "Getting Started" (min order: 1), then "DSL Language" (min order: 10).

---

## Fallback Behavior

If frontmatter is missing:

- **Title:** Generated from filename (`quick-start.md` → `"Quick Start"`)
- **Description:** Extracted from first paragraph of content
- **Section:** Uses `defaultSection` option (default: `"Documentation"`)
- **Order:** Defaults to `999` (appears at end)

---

## Hidden Pages

Mark pages as `hidden: true` to exclude from navigation:

```yaml
---
title: Draft Page
hidden: true
---
```

This is useful for work-in-progress docs that exist in the repo but shouldn't be shown yet.

---

## Related Documentation

**Prerequisites:** Basic YAML knowledge, SvelteKit understanding

**Next Steps:**
- [Frontmatter Parser](../utilities/frontmatter.md) - Parse YAML frontmatter

**Related:**
- [Getting Started](../getting-started.md) - Quick start guide
