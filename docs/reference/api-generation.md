---
title: API Generation
description: Auto-generate API documentation from TypeScript using the symbol reference system
section: Reference
difficulty: advanced
tags: [api, typescript, automation, symbols]
order: 1
---

# API Generation

Auto-generate API documentation from your TypeScript source code using the symbol reference system.

## Overview

The symbol reference system extracts type information from TypeScript and generates documentation automatically. This keeps your API docs in sync with your code.

**Key Benefits:**
- Always up-to-date with source code
- Type-safe references in markdown
- Automatic JSDoc extraction
- GitHub source links

## Quick Start

### 1. Create Generation Script

```typescript
// scripts/docs/generate-symbol-map.ts
import * as ts from 'typescript';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

async function generateSymbolMap() {
  // Find all TypeScript files
  const files = await glob('src/**/*.ts', {
    ignore: ['**/*.test.ts', '**/node_modules/**'],
  });

  const symbolMap: Record<string, any[]> = {};
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
  });

  // Process each file
  for (const file of files) {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) continue;

    ts.forEachChild(sourceFile, (node) => {
      if (isExportedDeclaration(node)) {
        const symbol = extractSymbol(node, sourceFile);
        if (symbol) {
          symbolMap[symbol.name] = symbolMap[symbol.name] || [];
          symbolMap[symbol.name].push(symbol);
        }
      }
    });
  }

  // Write to JSON
  const outputPath = 'docs/.generated/symbol-map.json';
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(symbolMap, null, 2));

  console.log(`Generated ${Object.keys(symbolMap).length} symbols`);
}

function isExportedDeclaration(node: ts.Node): boolean {
  return !!(
    ts.getCombinedModifierFlags(node as ts.Declaration) &
    ts.ModifierFlags.Export
  );
}

function extractSymbol(node: ts.Node, sourceFile: ts.SourceFile) {
  // Extract symbol information
  // See full implementation in examples/
}

generateSymbolMap();
```

### 2. Add NPM Scripts

```json
{
  "scripts": {
    "docs:symbols": "tsx scripts/docs/generate-symbol-map.ts",
    "prebuild": "pnpm docs:symbols",
    "dev:docs": "pnpm docs:symbols && vite dev"
  }
}
```

### 3. Use in Documentation

```markdown
# API Reference

## Types

The {@RequestState} type manages request lifecycle.

:::reference RequestState
:::

## Functions

Call {@createWorkflow} to initialize a new workflow:

:::reference createWorkflow
show: signature,params,returns,example
:::
```

## Symbol Extraction

### Supported Symbol Kinds

**Types**
```typescript
export type RequestState = 'idle' | 'loading' | 'success' | 'error';
```

**Interfaces**
```typescript
export interface Config {
  apiKey: string;
  timeout: number;
}
```

**Classes**
```typescript
export class WorkflowEngine {
  start() { /* ... */ }
}
```

**Functions**
```typescript
export function createWorkflow(config: Config): Workflow {
  // ...
}
```

**Enums**
```typescript
export enum Status {
  Pending,
  Active,
  Complete
}
```

**Constants**
```typescript
export const DEFAULT_TIMEOUT = 5000;
```

### JSDoc Extraction

Extract documentation from JSDoc comments:

```typescript
/**
 * Creates a new workflow instance.
 *
 * @param config - Workflow configuration
 * @param config.apiKey - API authentication key
 * @param config.timeout - Request timeout in milliseconds
 * @returns Configured workflow instance
 *
 * @example
 * ```typescript
 * const workflow = createWorkflow({
 *   apiKey: 'sk-...',
 *   timeout: 5000
 * });
 * ```
 */
export function createWorkflow(config: Config): Workflow {
  // ...
}
```

Generated symbol:
```json
{
  "name": "createWorkflow",
  "kind": "function",
  "signature": "function createWorkflow(config: Config): Workflow",
  "jsDoc": {
    "description": "Creates a new workflow instance.",
    "params": [
      {
        "name": "config",
        "type": "Config",
        "description": "Workflow configuration"
      }
    ],
    "returns": "Configured workflow instance",
    "example": "..."
  }
}
```

## Build Integration

### Pre-commit Hook

Keep symbol map in sync automatically:

```bash
#!/bin/sh
# .husky/pre-commit

pnpm docs:symbols
git add docs/.generated/symbol-map.json
```

### CI/CD Validation

Verify symbol map is up-to-date:

```yaml
# .github/workflows/docs.yml
name: Docs

on: [push, pull_request]

jobs:
  validate:
    runs on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm docs:symbols
      - name: Check for changes
        run: |
          git diff --exit-code docs/.generated/symbol-map.json
```

### Watch Mode

Auto-regenerate during development:

```typescript
// scripts/docs/watch-symbols.ts
import { watch } from 'chokidar';
import { generateSymbolMap } from './generate-symbol-map';

const watcher = watch('src/**/*.ts', {
  ignored: /node_modules/,
  persistent: true,
});

watcher.on('change', async (path) => {
  console.log(`File changed: ${path}`);
  await generateSymbolMap();
});

console.log('Watching for TypeScript changes...');
```

## Advanced Patterns

### Monorepo Setup

Generate symbols from multiple packages:

```typescript
const packages = ['packages/core', 'packages/utils', 'packages/ui'];

for (const pkg of packages) {
  const files = await glob(`${pkg}/src/**/*.ts`);
  // Process files...
}
```

### Custom Filters

Only document specific symbols:

```typescript
function shouldInclude(symbol: SymbolDefinition): boolean {
  // Skip private symbols
  if (symbol.name.startsWith('_')) return false;

  // Skip test utilities
  if (symbol.path.includes('test-utils')) return false;

  // Only include documented symbols
  return !!symbol.jsDoc?.description;
}
```

### Performance Optimization

Cache unchanged files:

```typescript
const cache = loadCache();

for (const file of files) {
  const stats = fs.statSync(file);
  const cached = cache[file];

  if (cached && cached.mtime === stats.mtimeMs) {
    symbolMap = { ...symbolMap, ...cached.symbols };
    continue;
  }

  // Process file...
  cache[file] = {
    mtime: stats.mtimeMs,
    symbols: extractedSymbols,
  };
}

saveCache(cache);
```

## Troubleshooting

**Symbols not updating?**
Clear cache: `rm .dev/tmp/symbol-cache.json && pnpm docs:symbols`

**TypeScript errors during generation?**
Check your `tsconfig.json` configuration matches your script settings.

**Missing symbols?**
Verify symbols are exported and not excluded in glob patterns.

**Performance issues?**
Implement caching (see Performance Optimization above).

## Related

- [Symbol References Plugin](../plugins/symbol-references.md) - Use symbols in markdown
- [Examples Guide](../guides/examples.md) - Complete generation scripts
- [Architecture](../guides/architecture.md) - System design philosophy
