<h1 align="center">@goobits/docs-engine</h1>

<p align="center"><strong>A Markdown documentation runtime and toolchain for SvelteKit.</strong></p>
<p align="center">Render pages, navigation, search, references, screenshots, and shared documentation UI from one configured content source.</p>

<p align="center">
  <a href="#why-docs-engine">Why Docs Engine</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#public-surface">Public surface</a> ·
  <a href="#documentation">Documentation</a>
</p>

---

## Why Docs Engine

Docs Engine keeps Markdown processing, SvelteKit route adapters, navigation,
search, reference rendering, screenshots, components, and styles in one shared
system. The repository also contains a separate CLI package for scaffolding and
maintenance tasks.

The runtime does not decide where a host stores Markdown or how its application
is deployed. Callers provide content loaders, route configuration, and any
server-only capabilities they enable.

## Quick start

Create a complete SvelteKit documentation site:

```bash
pnpm dlx --package @goobits/docs-engine-cli create-docs-engine my-docs
cd my-docs
pnpm dev
```

For an existing SvelteKit application:

```bash
pnpm add @goobits/docs-engine @lucide/svelte
```

Follow [Getting started](docs/getting-started.md) for the maintained route files,
content loaders, components, styles, and configuration.

## Packages

| Package | Responsibility |
| --- | --- |
| `@goobits/docs-engine` | Markdown rendering, components, SvelteKit integration, navigation, search, reference helpers, and server utilities |
| `@goobits/docs-engine-cli` | Site scaffolding, reference generation, link checking, and documentation versions |

Published CLI releases expose `docs-engine` and `create-docs-engine` through the
package's `publishConfig`. In the source checkout the CLI entrypoints remain
TypeScript source until built.

## Public surface

| Import | Responsibility |
| --- | --- |
| `@goobits/docs-engine` | Top-level configuration and Markdown docs engine |
| `/sveltekit` | Markdown-directory adapter and route helpers |
| `/components` | Public Svelte documentation components |
| `/server` | Node-oriented rendering, screenshots, Git, and filesystem utilities |
| `/plugins` | Low-level Markdown plugins |
| `/reference` | Symbol resolution and source-link rendering |
| `/utils`, `/navigation-scanner`, `/config` | Focused utilities and configuration |
| `/styles` | Shared documentation CSS |

Component implementation files remain private; import them through
`@goobits/docs-engine/components`. The source checkout's export map points to
`src/` for workspace development. Package build and publication materialize the
compiled release surface.

## CLI

```bash
pnpm add -D @goobits/docs-engine-cli

docs-engine check-links --base-dir docs --public-dir static
docs-engine reference --root . --source 'src/**/*.ts' --output-dir docs/api
docs-engine version list --docs-dir docs
```

See the [CLI README](packages/docs-engine-cli/README.md) for exact command
options and mutation behavior. Reference and version commands can write files;
review their destinations before running them.

## Documentation

- [Getting started](docs/getting-started.md)
- [Architecture and ownership](docs/guides/architecture.md)
- [Plugin order](docs/guides/plugin-order.md)
- [Examples](docs/guides/examples.md)
- [API reference generation](docs/reference/api-generation.md)
- [Contributing](CONTRIBUTING.md)

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test:run
```

## License

[FSL-1.1-ALv2](LICENSE) © [Goobits](https://github.com/goobits). Each version
becomes additionally available under Apache 2.0 on the second anniversary of
the date that version is made available.
