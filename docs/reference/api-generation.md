---
title: API Generation
description: Generate API symbol maps and Markdown reference pages from TypeScript
section: Reference
difficulty: advanced
tags: [api, typescript, automation, symbols]
order: 1
---

# API Generation

The Docs Engine CLI extracts exported TypeScript declarations, JSDoc summaries, signatures, and source locations. It writes a canonical symbol map and Markdown reference page without a project-owned parser script.

## Generate a reference

Install the CLI:

```bash
pnpm add -D @goobits/docs-engine-cli
```

Run the reference command:

```bash
docs-engine reference \
  --root . \
  --source 'src/**/*.ts' \
  --output-dir docs/api \
  --title 'API Reference' \
  --repository-url https://github.com/acme/widgets \
  --repository-branch main
```

The output directory contains:

- `symbol-map.json`, used by symbol-reference rendering
- `reference.md`, a generated Markdown API index

Add an explicit project script when generation belongs in the build:

```json
{
  "scripts": {
    "docs:reference": "docs-engine reference --root . --source 'src/**/*.ts' --output-dir docs/api",
    "prebuild": "pnpm docs:reference"
  }
}
```

## Selection

The extractor follows exported declarations and excludes common test, fixture, dependency, and build paths. Override patterns at the CLI boundary:

```bash
docs-engine reference \
  --source 'src/**/*.ts' 'packages/*/src/**/*.ts' \
  --exclude '**/*.test.ts' '**/*.spec.ts' '**/internal/**'
```

Supported declarations include functions, interfaces, type aliases, classes, methods, enums, and exported variables. Overloads are deduplicated, and Svelte module scripts are supported by the workspace library extractor.

## Source links

Set repository metadata to make generated symbols link to source:

```bash
docs-engine reference \
  --repository-url https://github.com/acme/widgets \
  --repository-branch stable \
  --repository-root packages/widgets
```

`--repository-root` is the path from the repository root to the scanned `--root` directory.

## Watch and benchmark

```bash
docs-engine reference --root . --watch
docs-engine reference --root . --benchmark
```

Watch mode regenerates after source changes. Benchmark mode reports extraction timing without writing reference output.

## Use the symbol map

Pass the generated map through the `references` option of `createSvelteKitDocs`, then use inline or block references in Markdown:

```markdown
The {@RequestState} type describes the request lifecycle.

:::reference RequestState
show: signature,description
:::
```

## Custom monorepo catalogs

Large repositories often need package tiers, export-surface policy, or multiple reference providers. Import the generic library instead of copying extraction and rendering:

```ts
import {
  extractWorkspacePackageSymbols,
  outputReferencePages,
  renderReferencePage,
} from '@goobits/docs-engine-cli/library';
```

The host repository owns package selection and policy. The CLI library owns export traversal, TypeScript and Svelte extraction, generic rendering, and generated-file output.

## Troubleshooting

### No symbols found

- Confirm `--root` and `--source` match maintained source files.
- Confirm declarations are exported through the package entry surface.
- Check that exclude patterns are not broader than intended.

### Source links point to the wrong path

Set `--repository-root` to the scanned package path inside the repository.

### Generated pages are stale

Run the same reference command used by the project's build or check script. Keep one canonical command in `package.json` so local and automated validation use identical inputs.
