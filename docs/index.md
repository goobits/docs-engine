---
title: Documentation
description: Complete documentation for @goobits/docs-engine
---

# docs-engine Documentation

Battery-included documentation system for SvelteKit with markdown rendering, screenshots, search, and symbol references.

## Documentation Structure

```filetree
docs/
├── index.md
├── getting-started.md
├── guides/
│   ├── architecture.md
│   ├── examples.md
│   ├── diagrams.md
│   └── plugin-order.md
├── plugins/
│   ├── callouts.md
│   ├── code-highlighting.md
│   ├── code-tabs.md
│   ├── collapse.md
│   ├── filetree.md
│   ├── frontmatter.md
│   ├── image-optimization.md
│   ├── katex.md
│   ├── links.md
│   ├── mermaid.md
│   ├── navigation.md
│   ├── screenshots.md
│   ├── symbol-references.md
│   └── toc.md
└── reference/
    └── (future API docs)
```

## Quick Start

New to docs-engine? Start here:

- **[Getting Started](./getting-started.md)** - 5-minute setup guide
- **[Installation](../README.md#installation)** - Package installation

## Core Guides

> **Note:** All guides use our plugins! You'll see callouts, diagrams, code highlighting, and more in action.

Learn the fundamentals:

- **[Architecture](./guides/architecture.md)** - System design and philosophy
- **[Plugin Order](./guides/plugin-order.md)** - Understanding plugin execution order *(uses mermaid diagrams!)*
- **[Examples](./guides/examples.md)** - Code examples and recipes
- **[Diagrams](./guides/diagrams.md)** - Visual architecture diagrams *(pure mermaid showcase!)*

## Plugins

### Markdown Enhancement

- **[Callouts](./plugins/callouts.md)** - Styled note/warning/info boxes
- **[Collapse](./plugins/collapse.md)** - Collapsible sections with details/summary
- **[KaTeX](./plugins/katex.md)** - Mathematical equations with LaTeX
- **[Mermaid](./plugins/mermaid.md)** - Diagram rendering
- **[Code Tabs](./plugins/code-tabs.md)** - Tabbed code examples
- **[Code Highlighting](./plugins/code-highlighting.md)** - Syntax highlighting with Shiki

### Content Processing

- **[Links](./plugins/links.md)** - Convert relative paths to absolute URLs
- **[Table of Contents](./plugins/toc.md)** - Auto-generate TOC
- **[Frontmatter Parser](./plugins/frontmatter.md)** - Parse YAML metadata

### Navigation

- **[Navigation Builder](./plugins/navigation.md)** - Auto-generate navigation structure
- **[File Tree](./plugins/filetree.md)** - Interactive file trees

### Media

- **[Screenshots](./plugins/screenshots.md)** - Automated screenshot generation
- **[Image Optimization](./plugins/image-optimization.md)** - Auto WebP/AVIF generation

### Advanced

- **[Symbol References](./plugins/symbol-references.md)** - Link to TypeScript symbols

## Reference

- **[API Generation](./reference/api-generation.md)** - Auto-generate API docs from TypeScript

## Learning Paths

> **Tip:** Choose the path that matches your experience level. Each path builds on the previous one.

### Beginner Path

1. [Getting Started](./getting-started.md)
2. [Links Plugin](./plugins/links.md)
3. [Table of Contents](./plugins/toc.md)
4. [Frontmatter Parser](./plugins/frontmatter.md)

### Intermediate Path

1. [Plugin Order](./guides/plugin-order.md)
2. [Navigation Builder](./plugins/navigation.md)
3. [Image Optimization](./plugins/image-optimization.md)
4. [Screenshots](./plugins/screenshots.md)

### Advanced Path

1. [Architecture](./guides/architecture.md)
2. [Symbol References](./plugins/symbol-references.md)
3. [Examples](./guides/examples.md)
4. [API Generation](./reference/api-generation.md)

## Features Showcased in This Documentation

> **Tip:** This documentation practices what it preaches! Here's what you're seeing in action:

### Visual & Interactive
- **Callouts** - All the colored `> **Note/Warning/Tip**` boxes you see
- **Collapse Sections** - Collapsible content in [Collapse Plugin](./plugins/collapse.md) *(dogfooding!)*
- **Mermaid Diagrams** - Flowcharts in [Plugin Order Guide](./guides/plugin-order.md)
- **File Trees** - Directory structures like the one at the top of this page
- **Table of Contents** - Auto-generated `## TOC` sections in guides

### Code Enhancement
- **Code Tabs** - Multiple language examples (see [code-highlighting.md](./plugins/code-highlighting.md))
- **Line Highlighting** - Important lines highlighted in code blocks
- **Diff Syntax** - Red/green additions and deletions
- **Syntax Highlighting** - All code blocks use Shiki

### Content Processing
- **Frontmatter** - Every doc has YAML metadata at the top
- **Links** - All relative markdown links work correctly
- **Navigation** - Organized structure with sections

### Mathematical Content
- **Math Rendering** - LaTeX equations with KaTeX in [KaTeX Plugin](./plugins/katex.md) *(now dogfooding!)*

**Not Yet Shown** *(could be added with actual implementation)*:
- Symbol References - `{@Symbol}` syntax *(needs symbol map)*
- Screenshots - Automated captures *(needs Playwright setup)*
- Image Optimization - WebP/AVIF *(needs images)*

---

## Need Help?

- Check the [Troubleshooting Guide](./guides/architecture.md#troubleshooting) (when available)
- Open an issue on [GitHub](https://github.com/goobits/docs-engine/issues)
