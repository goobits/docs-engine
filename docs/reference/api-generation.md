---
title: API Generation
description: Automatic API documentation generation from TypeScript source code
section: Reference
difficulty: advanced
---

# API Generation

> **Status:** Documentation auto-generation is being implemented as part of the "eating our own dog food" initiative.

## Overview

The docs-engine includes powerful API documentation generation tools that extract documentation from TypeScript source code and JSDoc comments.

## Quick Start

```typescript
import { parseApi, generateApiDocFile } from '@goobits/docs-engine/server';

// Parse TypeScript files
const apiFiles = parseApi({
  entryPoints: ['src/lib/plugins/*.ts'],
  exclude: ['**/*.test.ts', '**/index.ts']
});

// Generate markdown documentation
for (const file of apiFiles) {
  const { content, fileName } = generateApiDocFile(file, {
    baseUrl: '/docs/reference',
    includeSourceLinks: true,
    repoUrl: 'https://github.com/your-org/your-repo'
  });

  // Write to disk
  await fs.writeFile(`docs/reference/${fileName}`, content);
}
```

## Features

### Source Code Parsing

- ✅ **Functions** - Parameters, return types, JSDoc
- ✅ **Classes** - Properties, methods, constructors
- ✅ **Interfaces** - Properties, inheritance
- ✅ **Type Aliases** - Complex types with full definitions
- ✅ **Enums** - All enum members
- ✅ **Constants** - Exported constants with values

### JSDoc Support

- `@param` - Parameter descriptions
- `@returns` - Return value documentation
- `@example` - Code examples (automatically formatted)
- `@deprecated` - Deprecation warnings
- `@since` - Version information
- `@category` - Logical grouping
- `@public` / `@internal` - Visibility control

### Output Features

- **Type-aware** - Full TypeScript type information
- **Source links** - Links to GitHub/GitLab source
- **Table of Contents** - Auto-generated navigation
- **Examples** - Extracted from `@example` tags
- **Markdown** - Clean, readable markdown output

## Configuration

### parseApi Options

```typescript
interface ParseApiOptions {
  entryPoints: string[];      // Glob patterns for files to parse
  exclude?: string[];          // Patterns to exclude
  tsConfigPath?: string;       // Path to tsconfig.json
  project?: string;            // TypeScript project root
}
```

### generateApiDocFile Options

```typescript
interface GenerateApiDocOptions {
  baseUrl: string;             // Base URL for links
  includeSourceLinks?: boolean; // Add GitHub/GitLab links
  repoUrl?: string;            // Repository URL
  repoBranch?: string;         // Branch name (default: 'main')
  includePrivate?: boolean;    // Include @internal items
}
```

## Examples

### Generate Plugin Documentation

```typescript
// Generate docs for all plugins
const plugins = parseApi({
  entryPoints: ['src/lib/plugins/*.ts'],
  exclude: ['**/*.test.ts', '**/index.ts']
});

for (const file of plugins) {
  const { content } = generateApiDocFile(file, {
    baseUrl: '/docs/reference/plugins',
    includeSourceLinks: true,
    repoUrl: 'https://github.com/goobits/docs-engine',
    repoBranch: 'main'
  });

  // Save to docs/reference/plugins/{filename}.md
}
```

### Generate Utility Documentation

```typescript
// Generate docs for utilities with categorization
const utils = parseApi({
  entryPoints: ['src/lib/utils/*.ts'],
  exclude: ['**/*.test.ts', '**/index.ts']
});

// Group by @category tag
const grouped = groupByCategory(utils);

// Generate one file per category
for (const [category, items] of grouped) {
  const content = generateCategoryDoc(category, items);
  // Save to docs/reference/utils/{category}.md
}
```

### Build Script Integration

```typescript
// scripts/generate-api-docs.ts
import { parseApi, generateApiDocFile } from '@goobits/docs-engine/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

async function generateDocs() {
  const outputDir = 'docs/reference';
  await mkdir(outputDir, { recursive: true });

  // Parse all source files
  const files = parseApi({
    entryPoints: [
      'src/lib/plugins/*.ts',
      'src/lib/utils/*.ts',
      'src/lib/server/*.ts'
    ],
    exclude: ['**/*.test.ts', '**/index.ts', '**/types.ts']
  });

  console.log(`Generating docs for ${files.length} files...`);

  for (const file of files) {
    const { content, fileName } = generateApiDocFile(file, {
      baseUrl: '/docs/reference',
      includeSourceLinks: true,
      repoUrl: 'https://github.com/goobits/docs-engine'
    });

    await writeFile(join(outputDir, fileName), content);
    console.log(`✓ Generated ${fileName}`);
  }

  console.log('✨ API documentation generated successfully!');
}

generateDocs().catch(console.error);
```

## Output Format

### Generated Documentation Structure

Each generated file includes:

```markdown
# SymbolName

> Brief description from JSDoc

**Added in:** v1.0.0
**⚠️ DEPRECATED:** Use newSymbol instead

\`\`\`typescript
function symbolName<T>(param1: string, param2?: number): Promise<T>
\`\`\`

## Parameters

- **param1**: `string` - Description
- **param2** (optional): `number` = `10` - Description

## Returns

`Promise<T>` - Description

## Examples

\`\`\`typescript
// Example code from @example tag
\`\`\`

## Source

[file.ts:42](https://github.com/org/repo/blob/main/src/file.ts#L42)
```

## Best Practices

### 1. Comprehensive JSDoc

Write detailed JSDoc comments with:
- Clear descriptions
- Complete `@param` documentation
- Explicit `@returns` documentation
- Practical `@example` code snippets

### 2. Category Organization

Use `@category` tags to group related items:

```typescript
/**
 * Parse markdown frontmatter
 * @category Markdown
 */
export function parseFrontmatter(content: string): Frontmatter {
  // ...
}
```

### 3. Visibility Control

Mark internal APIs:

```typescript
/**
 * Internal helper function
 * @internal
 */
function internalHelper() {
  // ...
}
```

### 4. Versioning

Track API changes:

```typescript
/**
 * New feature
 * @since 2.0.0
 */
export function newFeature() {
  // ...
}
```

## Automation

### Pre-build Hook

```json
{
  "scripts": {
    "docs:api": "tsx scripts/generate-api-docs.ts",
    "docs:build": "npm run docs:api && vite build",
    "prebuild": "npm run docs:api"
  }
}
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit
npm run docs:api
git add docs/reference/
```

### CI/CD Integration

```yaml
# .github/workflows/docs.yml
- name: Generate API Docs
  run: npm run docs:api

- name: Check for changes
  run: |
    if [[ $(git status --porcelain docs/reference/) ]]; then
      echo "API docs are out of date!"
      exit 1
    fi
```

## Next Steps

1. ✅ Write comprehensive JSDoc comments
2. ✅ Run `parseApi()` on your source files
3. ✅ Generate documentation with `generateApiDocFile()`
4. ✅ Integrate into your build process
5. ✅ Keep docs auto-updated and never manually edited

## Related

- [Plugins](../plugins/) - Plugin documentation
- [Examples](../examples.md) - More examples
- [Getting Started](../getting-started.md) - Initial setup
