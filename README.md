# @goobits/docs-engine

Reusable documentation runtime and tooling for SvelteKit. It turns a Markdown directory into rendered pages, navigation, search, edit links, and a responsive documentation layout.

## Quick start

Create a complete SvelteKit docs site:

```bash
pnpm dlx --package @goobits/docs-engine-cli create-docs-engine my-docs
cd my-docs
pnpm dev
```

The scaffold includes the SvelteKit routes, sample Markdown, search endpoint, styles, type checking, link checking, and production build configuration.

For an existing SvelteKit app:

```bash
pnpm add @goobits/docs-engine @lucide/svelte
```

See [Getting Started](docs/getting-started.md) for the route files and configuration.

## Packages

| Package | Owns |
| --- | --- |
| `@goobits/docs-engine` | Markdown rendering, components, SvelteKit adapter, navigation, search, and server utilities |
| `@goobits/docs-engine-cli` | Project scaffolding, API reference generation, link checking, and docs version commands |

## SvelteKit adapter

The adapter is the shortest supported integration. Give it Markdown loaders and reuse its page, layout, and search handlers:

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

Render returned page data with `DocsLayout` from `@goobits/docs-engine/components`, and import `@goobits/docs-engine/styles` once in the host app.

## Public entry points

- `@goobits/docs-engine`: browser-safe plugins, configuration, and utilities
- `@goobits/docs-engine/sveltekit`: Markdown directory adapter for SvelteKit
- `@goobits/docs-engine/components`: Svelte documentation UI
- `@goobits/docs-engine/server`: Node-only rendering, screenshots, Git, and file operations
- `@goobits/docs-engine/plugins`: low-level Markdown plugins
- `@goobits/docs-engine/reference`: symbol resolution and source-link rendering
- `@goobits/docs-engine/styles`: shared documentation styles

Package imports resolve to compiled JavaScript. The `source` export condition remains available to linked monorepo development.

## CLI

Install the CLI in an existing project:

```bash
pnpm add -D @goobits/docs-engine-cli
```

Common commands:

```bash
docs-engine check-links --base-dir docs --public-dir static
docs-engine reference --root . --source 'src/**/*.ts' --output-dir docs/api
docs-engine version list --docs-dir docs
```

See the [CLI README](packages/docs-engine-cli/README.md) for command options.

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture and ownership](docs/guides/architecture.md)
- [Plugin order](docs/guides/plugin-order.md)
- [Examples](docs/guides/examples.md)
- [API reference generation](docs/reference/api-generation.md)

## License

Licensed under the Functional Source License, Version 1.1, ALv2 Future License. Each released version becomes available under Apache License 2.0 two years after release. See [LICENSE](LICENSE).
