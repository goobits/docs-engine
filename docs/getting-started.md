---
title: Getting Started
description: Get docs-engine running in your SvelteKit project in 5 minutes
section: Getting Started
difficulty: beginner
tags: [quickstart, setup, installation]
---

# Getting Started

Get docs-engine running in your SvelteKit project in 5 minutes.

## TOC

> **Tip:** This guide takes about 5 minutes. By the end, you'll have a fully working documentation system.

## Prerequisites

- Node.js 18+
- SvelteKit project
- Basic markdown knowledge

## Step 1: Install

```bash
pnpm add @goobits/docs-engine
```

## Step 2: Configure MDSveX

Add plugins to your `svelte.config.js`:

```javascript
import { mdsvex } from 'mdsvex';
import {
  linksPlugin,
  tocPlugin,
  calloutsPlugin,
  codeHighlightPlugin,
} from '@goobits/docs-engine/plugins';

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [
    mdsvex({
      remarkPlugins: [
        calloutsPlugin(),
        tocPlugin(),
        linksPlugin(),
        codeHighlightPlugin({
          theme: 'dracula',
          showLineNumbers: false
        }),
      ],
    }),
  ],
};
```

## Step 3: Create Your First Doc

> **Note:** We're using our own plugins here! Notice the `## TOC` marker and callouts.

Create `src/routes/docs/hello.md`:

```markdown
---
title: Hello World
description: My first doc
---

# Hello World

Welcome to docs-engine!

## Table of Contents

## Introduction

This is my first documentation page using docs-engine.

> **Note:** The table of contents will be auto-generated here.

## Features

- Markdown rendering
- Syntax highlighting
- Auto-generated TOC
- And much more!

## Next Steps

Check out the [plugins](../../plugins) to enhance your docs.
```

## Step 4: Import Styles

In your main CSS/SCSS file:

```scss
@import '@goobits/docs-engine/styles';
```

## Step 5: View Your Docs

Start your dev server:

```bash
pnpm dev
```

Navigate to `http://localhost:5173/docs/hello`

## Next Steps

### Enhance Your Docs

Add more plugins:

- **[Navigation Builder](./plugins/navigation.md)** - Auto-generate sidebar navigation
- **[Callouts](./plugins/callouts.md)** - Add note/warning/tip boxes
- **[Mermaid](./plugins/mermaid.md)** - Render diagrams
- **[Code Tabs](./plugins/code-tabs.md)** - Show code in multiple languages

### Learn More

- **[Plugin Order Guide](./guides/plugin-order.md)** - Understand plugin execution
- **[Architecture](./guides/architecture.md)** - System design
- **[Examples](./guides/examples.md)** - Code recipes

### Advanced Features

- **[Symbol References](./plugins/symbol-references.md)** - Link to TypeScript symbols
- **[Screenshots](./plugins/screenshots.md)** - Automated screenshot generation
- **[Image Optimization](./plugins/image-optimization.md)** - Auto WebP/AVIF

## Troubleshooting

### MDSveX not processing markdown

> **Warning:** This is the most common setup issue!

Ensure `.md` is in your `extensions` array:

```javascript
export default {
  extensions: ['.svelte', '.md'],
  // ...
};
```

### Styles not loading

Import the styles in your root layout or main CSS file:

```scss
@import '@goobits/docs-engine/styles';
```

### Plugins not working

Check plugin order in your `svelte.config.js`. Some plugins depend on others running first. See [Plugin Order Guide](./guides/plugin-order.md).

## Common Patterns

### Documentation Layout

> **Tip:** Use a consistent layout for all your documentation pages.

Create a docs layout at `src/routes/docs/+layout.svelte`:

```svelte
<script>
  import { page } from '$app/stores';
</script>

<div class="docs-layout">
  <nav class="docs-sidebar">
    <a href="/docs/getting-started" class:active={$page.url.pathname === '/docs/getting-started'}>
      Getting Started
    </a>
    <a href="/docs/plugins" class:active={$page.url.pathname.startsWith('/docs/plugins')}>
      Plugins
    </a>
  </nav>

  <main class="docs-content">
    <slot />
  </main>
</div>

<style>
  .docs-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .docs-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .docs-sidebar a {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    text-decoration: none;
  }

  .docs-sidebar a.active {
    background: var(--color-primary);
    color: white;
  }

  .docs-content {
    min-width: 0;
  }
</style>
```

### Project Structure

Here's what your docs structure should look like:

```filetree
src/
├── routes/
│   ├── docs/
│   │   ├── +layout.svelte
│   │   ├── +page.md
│   │   ├── getting-started.md
│   │   └── plugins/
│   │       ├── callouts.md
│   │       └── links.md
│   └── +layout.svelte
└── app.css
```

### Frontmatter Template

Use consistent frontmatter across your docs:

```yaml
---
title: "Page Title"
description: "Brief description for SEO"
section: "Getting Started"  # For navigation grouping
difficulty: "beginner"       # beginner | intermediate | advanced
tags: ["markdown", "setup"]
order: 1                     # Sort order in navigation
---
```

## Need Help?

- **[Full Documentation](./index.md)** - Complete docs index
- **[GitHub Issues](https://github.com/goobits/docs-engine/issues)** - Report bugs or request features
