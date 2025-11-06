---
title: Symbol References Plugin
description: Link to TypeScript types, functions, and other symbols in your documentation
section: Plugins
difficulty: advanced
tags: [plugin, typescript, symbols, references, jsdoc]
---

# Symbol References

Link to TypeScript types, functions, and other symbols in your documentation with `{@Symbol}` syntax.

## Overview

The symbol reference system provides JSDoc-style inline references that automatically link to source code. It's designed for API documentation, technical guides, and developer-facing content.

**Key features:**

- Inline references: `{@SymbolName}` → links to GitHub source
- Block references: `:::reference SymbolName` → full API docs
- Path hints for disambiguation: `{@path/hint#SymbolName}`
- Hover tooltips with type signatures
- Automatic error detection with helpful messages

## Quick Start

### 1. Generate Symbol Map

Create a script to scan your TypeScript files:

```typescript
// scripts/docs/generate-symbol-map.ts
import * as ts from 'typescript';
import { glob } from 'glob';
import fs from 'fs';

const files = await glob('src/**/*.ts', {
  ignore: ['**/*.test.ts', '**/node_modules/**'],
});

const symbolMap = {};

for (const file of files) {
  // Parse TypeScript and extract exported symbols
  // See examples/ directory for complete script
}

fs.writeFileSync(
  'docs/.generated/symbol-map.json',
  JSON.stringify(symbolMap, null, 2)
);
```

### 2. Add Plugin

```javascript
// svelte.config.js
import { referencePlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        referencePlugin(),
      ],
    }),
  ],
};
```

The plugin accepts {@ReferencePluginOptions} to customize the symbol map path and GitHub repository URL.

### 3. Use in Markdown

```markdown
# API Guide

The {@SymbolDefinition} type represents a parsed TypeScript symbol.

:::reference SymbolDefinition
:::
```

**Real examples from this documentation:**
- {@KaTeXOptions} - Configuration for the KaTeX plugin
- {@CodeHighlightOptions} - Options for code highlighting
- {@SymbolMap} - The generated symbol map structure

---

## Inline References

### Basic Syntax

Reference any exported symbol by name:

```markdown
The {@WorkflowState} type manages orchestrator state.
Call {@createWorkflow} to start a new workflow.
Use {@WorkflowEventType} enum for event filtering.
```

### With Path Hints

Disambiguate symbols that appear in multiple files:

```markdown
The orchestrator uses {@orchestrator/types#SessionState} while
Jules implementor has {@implementors/types#SessionState}.
```

**Path hint format:** `{@path/hint#SymbolName}`

- `path/hint` - Substring of the file path (e.g., `implementors/types`, `server/utils`)
- `#` - Separator
- `SymbolName` - Exact symbol name

### Supported Symbol Kinds

- `type` - Type aliases (`export type Foo = ...`)
- `interface` - Interfaces (`export interface Bar { ... }`)
- `class` - Classes (`export class Baz { ... }`)
- `function` - Functions (`export function qux() { ... }`)
- `enum` - Enums (`export enum Status { ... }`)
- `const` - Constants (`export const FOO = ...`)

---

## Block References

### Full API Documentation

Display complete API documentation for a symbol:

```markdown
:::reference RequestState
:::
```

### Selective Fields

Control which fields to display:

```markdown
:::reference createWorkflow
show: signature,params,returns
:::
```

**Available fields:**

- `signature` - Type signature or function declaration
- `description` - JSDoc description
- `params` - Function parameters
- `returns` - Return type
- `example` - JSDoc @example tag

---

## Disambiguation

### Why Disambiguation is Needed

When multiple files export the same symbol name, a reference like `{@SessionState}` is ambiguous.

### Error Messages

The plugin provides helpful error messages:

```
Symbol "SessionState" is ambiguous (2 matches).

Use a path hint to disambiguate:
  - {@implementors/types#SessionState}  // src/server/implementors/types.ts
  - {@orchestrator/types#SessionState}  // src/server/orchestrator/types.ts
```

### Path Hint Rules

1. **Minimal specificity** - Use the shortest path that uniquely identifies the symbol
2. **Directory or filename** - Prefer `types/session` over full path
3. **No extension** - Omit `.ts` extension
4. **Case sensitive** - Match exact casing

**Examples:**

```markdown
<!-- Good: minimal and clear -->
{@implementors/types#SessionState}
{@utils#parseConfig}

<!-- Avoid: too verbose -->
{@src/lib/server/implementors/types.ts#SessionState}
```

---

## Build Integration

### Pre-Build Generation

Ensure symbol map is generated before building:

```json
{
  "scripts": {
    "docs:symbols": "tsx scripts/docs/generate-symbol-map.ts",
    "prebuild": "pnpm docs:symbols",
    "build": "vite build"
  }
}
```

### Pre-Commit Hook

Keep symbol map in sync with code:

```bash
#!/bin/sh
# .husky/pre-commit

pnpm docs:symbols
git add docs/.generated/symbol-map.json
```

---

## Performance

### Caching

Implement caching in your generation script for faster builds:

```typescript
const cache: Record<string, CacheEntry> = loadCache();

for (const file of files) {
  if (!hasFileChanged(file, cache[file])) {
    console.log(`Using cached ${file}`);
    continue;
  }

  // Process file
  const symbols = extractSymbols(file);
  cache[file] = { mtime, hash, symbols };
}

saveCache(cache);
```

### Benchmark Results

Example from monorepo (327 files):

| Scenario | Time | Files Processed |
|----------|------|-----------------|
| Cold (no cache) | 8.2s | 327 |
| Warm (100% cache hit) | 1.1s | 0 |
| Partial (50% cache hit) | 4.5s | 164 |

---

## Troubleshooting

### Symbol Not Found

**Solutions:**

1. Check if symbol is exported: `export type FooBar = ...`
2. Regenerate symbol map: `pnpm docs:symbols`
3. Verify file is included in scan patterns
4. Check file isn't excluded

### Ambiguous Symbol

**Solution:** Use the suggested path hint from the error message.

### Symbol Map Out of Sync

```bash
# Clear cache
rm .dev/tmp/symbol-cache.json

# Regenerate
pnpm docs:symbols
```

---

## Best Practices

1. **Use inline for mentions** - `{@RequestState}` for brief references
2. **Use block for detailed docs** - `:::reference RequestState:::` for full API
3. **Add path hints proactively** - Prevents future ambiguity
4. **Document complex types** - Add JSDoc comments
5. **Group related symbols** - Organize in tables or lists

---

## Related Documentation

**Prerequisites:** TypeScript knowledge, understanding of AST parsing

**Next Steps:**
- [Examples Guide](../guides/examples.md) - Complete generation script examples
- [Architecture](../guides/architecture.md) - System design

**Related:**
- [Diagrams](../guides/diagrams.md) - Visual system overview
