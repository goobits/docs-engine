---
title: Documentation
description: Guides and reference material for Docs Engine
section: Getting Started
order: 1
---

# Docs Engine Documentation

Docs Engine provides reusable Markdown rendering, Svelte documentation components, a SvelteKit route adapter, search, screenshots, link checking, and API reference generation.

## Start here

- [Getting Started](./getting-started.md): scaffold a site or add docs to an existing SvelteKit app
- [Architecture](./guides/architecture.md): understand runtime, CLI, and host-project ownership
- [API Generation](./reference/api-generation.md): generate symbol maps and Markdown references
- [Examples](./guides/examples.md): browse integration recipes

## Runtime features

### Markdown and presentation

- [Callouts](./plugins/callouts.md)
- [Code highlighting](./plugins/code-highlighting.md)
- [Code tabs](./plugins/code-tabs.md)
- [Collapsible sections](./plugins/collapse.md)
- [KaTeX](./plugins/katex.md)
- [Links](./plugins/links.md)
- [Mermaid](./plugins/mermaid.md)
- [Table of contents](./plugins/toc.md)
- [Symbol references](./plugins/symbol-references.md)

### Media and structure

- [File trees](./plugins/filetree.md)
- [Image optimization](./plugins/image-optimization.md)
- [Screenshots](./plugins/screenshots.md)
- [Frontmatter](./utilities/frontmatter.md)
- [Navigation](./utilities/navigation.md)

### Svelte components

- [DocsLayout](./components/docs-layout.md)
- [ThemeToggle](./components/theme-toggle.md)

## Build-time tools

The `@goobits/docs-engine-cli` package provides:

- a complete SvelteKit project scaffold
- Markdown link validation
- TypeScript API reference generation
- documentation version commands

See the [CLI README](../packages/docs-engine-cli/README.md) for commands and options.

## Recommended order

1. Scaffold a new site or follow the existing-app setup in [Getting Started](./getting-started.md).
2. Keep Markdown and repository-specific policy in the host project.
3. Reuse `createSvelteKitDocs` for page, navigation, and search data.
4. Render the result with `DocsLayout` and import the shared styles once.
5. Run type checking, link checking, a production build, and HTTP smoke tests before deployment.

## More guides

- [Plugin order](./guides/plugin-order.md)
- [Diagrams](./guides/diagrams.md)
- [Migration](./guides/migration.md)
- [Accessibility](./guides/accessibility.md)

For defects or feature requests, open an issue in the [Docs Engine repository](https://github.com/goobits/docs-engine/issues).
