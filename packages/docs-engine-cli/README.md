# @goobits/docs-engine-cli

Build-time tools for Docs Engine projects: SvelteKit scaffolding, API reference generation, link checking, and documentation versions.

## Scaffold a site

Run the `create-docs-engine` binary from the package:

```bash
pnpm dlx --package @goobits/docs-engine-cli create-docs-engine my-docs
```

With npm:

```bash
npm exec --yes --package=@goobits/docs-engine-cli -- create-docs-engine my-docs
```

The generated project is a complete SvelteKit app with Markdown content, adapter-based docs routes, navigation, search, shared styles, type checking, link checking, and production build scripts.

Options:

```text
--yes, -y                    Use recommended feature defaults
--help, -h                   Show command help
--package-manager <manager>  npm, pnpm, or yarn
--no-install                 Generate files without installing dependencies
--force                      Replace an existing project directory
--docs-engine <specifier>    Override the runtime package specifier
--docs-engine-cli <specifier> Override the CLI package specifier
```

Package specifier overrides are useful for prerelease and local tarball validation.

## Install in an existing project

```bash
pnpm add -D @goobits/docs-engine-cli
```

This installs two binaries:

- `docs-engine`: validation, reference, and version commands
- `create-docs-engine`: project scaffolding

## API reference generation

Generate a symbol map and Markdown reference from exported TypeScript APIs:

```bash
docs-engine reference \
  --root . \
  --source 'src/**/*.ts' \
  --output-dir docs/api \
  --repository-url https://github.com/acme/widgets \
  --repository-branch main
```

Common options:

- `--exclude <patterns...>`: excluded source patterns
- `--cache-dir <path>`: incremental extraction cache
- `--title <title>`: generated page title
- `--repository-root <path>`: path from repository root to the scanned package
- `--watch`: regenerate when source changes
- `--benchmark`: report extraction timing without writing the reference

The `@goobits/docs-engine-cli/library` entry point also exports generic workspace extraction, reference rendering, and generated-page output helpers for custom monorepo catalogs.

## Link checking

```bash
docs-engine check-links --base-dir docs --public-dir static
docs-engine check-links --base-dir docs --route-prefix /docs
docs-engine check-links --external
docs-engine check-links --json
```

Options:

- `--base-dir <path>`: Markdown root
- `--public-dir <path>`: root-relative site asset directory
- `--route-prefix <path>`: URL prefix mapped to the Markdown root
- `--pattern <glob>`: Markdown file pattern
- `--external`: validate external URLs
- `--timeout <ms>`: external request timeout
- `--concurrency <number>`: external request concurrency
- `--quiet`: print errors only
- `--verbose`: print all checked links
- `--json`: machine-readable output
- `--config <path>`: link checker configuration file

The default `.linkcheckerrc.json` shape is:

```json
{
  "baseDir": "docs",
  "publicDir": "static",
  "routePrefix": "/docs",
  "include": ["**/*.md", "**/*.mdx"],
  "checkExternal": false,
  "timeout": 5000,
  "concurrency": 10,
  "exclude": ["**/node_modules/**", "**/dist/**", "**/.git/**"],
  "skipDomains": ["localhost", "127.0.0.1"],
  "validExtensions": [".md", ".mdx"]
}
```

The command exits with status `1` when broken links or configuration errors are found.

## Documentation versions

```bash
docs-engine version create 2.0 --docs-dir docs
docs-engine version list --docs-dir docs
docs-engine version delete 1.0 --docs-dir docs
```

Versions are copied to `docs/versioned_docs/version-<version>/`, with metadata stored in `docs/versions.json`.
