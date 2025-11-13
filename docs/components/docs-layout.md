---
title: DocsLayout
description: Complete documentation layout with navigation, theme toggle, and content rendering
section: Components
difficulty: beginner
tags: [component, layout, navigation, ssr]
order: 2
---

# DocsLayout Component

Complete documentation layout combining navigation, theme toggle, and content rendering in one component.

## Quick Start

```svelte
<script lang="ts">
  import { DocsLayout } from '@goobits/docs-engine/components';

  export let data;
</script>

<DocsLayout
  content={data.content}
  title={data.title}
  navigation={data.sections}
  currentPath={data.path}
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | `string` | Yes | Rendered HTML content |
| `title` | `string` | Yes | Page title for header and meta |
| `navigation` | `Section[]` | Yes | Navigation structure |
| `currentPath` | `string` | Yes | Current page path for active state |
| `showTableOfContents` | `boolean` | No | Show TOC sidebar (default: `true`) |
| `class` | `string` | No | Custom class name |

## Navigation Structure

```typescript
interface Section {
  title: string;
  path?: string;
  items?: Section[];
}
```

## Complete Example

```svelte
<script lang="ts">
  import { DocsLayout } from '@goobits/docs-engine/components';
  import { page } from '$app/stores';

  export let data;

  const sections = [
    {
      title: "Getting Started",
      items: [
        { title: "Installation", path: "/docs/installation" },
        { title: "Quick Start", path: "/docs/quick-start" }
      ]
    },
    {
      title: "Guides",
      items: [
        { title: "Architecture", path: "/docs/guides/architecture" },
        { title: "Examples", path: "/docs/guides/examples" }
      ]
    }
  ];
</script>

<DocsLayout
  content={data.content}
  title={data.title}
  navigation={sections}
  currentPath={$page.url.pathname}
  showTableOfContents={true}
/>
```

## Features

**Responsive Layout** - Mobile-friendly with collapsible sidebar
**Theme Integration** - Includes ThemeToggle component
**Navigation Highlighting** - Auto-highlights current page
**Table of Contents** - Optional TOC sidebar
**Accessible** - Keyboard navigation, ARIA labels
**SSR Compatible** - Works with SvelteKit SSR

## Styling

Uses CSS Grid for responsive layout:

```css
.docs-layout {
  display: grid;
  grid-template-columns: 250px 1fr 200px;
  /* Sidebar | Content | TOC */
}

@media (max-width: 1024px) {
  grid-template-columns: 250px 1fr;
  /* Hide TOC on tablet */
}

@media (max-width: 768px) {
  grid-template-columns: 1fr;
  /* Collapsible sidebar on mobile */
}
```

## Troubleshooting

**Navigation not highlighting?**
Ensure `currentPath` matches your route paths exactly.

**Content not rendering?**
Check that `content` is rendered HTML, not raw markdown.

**Theme toggle not showing?**
Theme toggle is included by default. Check component props.

**Mobile sidebar not collapsing?**
Verify viewport meta tag in app.html.

## Related

- [ThemeToggle](./theme-toggle.md) - Included theme switcher
- [Navigation Builder](../utilities/navigation.md) - Generate navigation structure
- [Architecture Guide](../guides/architecture.md) - System design and philosophy

