# API Documentation Generation

Auto-generate beautiful API reference documentation from your TypeScript source code.

## Overview

The API documentation generator parses TypeScript files, extracts JSDoc comments and type information, and generates comprehensive markdown documentation automatically. This eliminates manual API documentation maintenance and ensures your docs always stay in sync with your code.

## Features

- ✅ **TypeScript Native** - Full support for TypeScript types, generics, and complex signatures
- ✅ **JSDoc Integration** - Extracts @param, @returns, @example, @deprecated, and custom tags
- ✅ **Type Linking** - Automatic links between type references
- ✅ **Smart Grouping** - Organize APIs by category or module
- ✅ **Rich Metadata** - Deprecation warnings, version info, experimental flags
- ✅ **Code Examples** - Syntax-highlighted examples from JSDoc
- ✅ **Source Links** - Link directly to source code on GitHub
- ✅ **Watch Mode** - Auto-regenerate on file changes (planned)

## Quick Start

### 1. Write TypeScript with JSDoc

```typescript
/**
 * Parse YAML frontmatter from markdown files
 * @param markdown - Markdown content with frontmatter
 * @returns Parsed frontmatter and content
 * @example
 * const result = parseFrontmatter('---\ntitle: Hello\n---\nContent');
 * console.log(result.frontmatter.title); // "Hello"
 */
export function parseFrontmatter(markdown: string): ParsedContent {
  // implementation
}
```

### 2. Generate API Docs

```bash
npx docs-engine generate-api \
  --entry-points "src/**/*.ts" \
  --output-dir docs/api \
  --repo-url https://github.com/user/repo \
  --source-links
```

### 3. Result

The generator creates:

```markdown
## parseFrontmatter

Parse YAML frontmatter from markdown files.

\`\`\`typescript
function parseFrontmatter(markdown: string): ParsedContent
\`\`\`

**Parameters:**

- **`markdown`**: `string` - Markdown content with frontmatter

**Returns:** `ParsedContent` - Parsed frontmatter and content

**Examples:**

\`\`\`typescript
const result = parseFrontmatter('---\ntitle: Hello\n---\nContent');
console.log(result.frontmatter.title); // "Hello"
\`\`\`

**Source:** [src/utils/frontmatter.ts:12](https://github.com/user/repo/blob/main/src/utils/frontmatter.ts#L12)
```

## Supported TypeScript Features

### Functions

```typescript
/**
 * Add two numbers
 * @param a - First number
 * @param b - Second number
 * @returns Sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}
```

### Generic Functions

```typescript
/**
 * Map an array of items
 * @param items - Array to map
 * @param fn - Mapping function
 * @returns Mapped array
 */
export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
  return items.map(fn);
}
```

### Classes

```typescript
/**
 * A simple counter class
 */
export class Counter {
  /**
   * Current count value
   */
  count: number = 0;

  /**
   * Increment the counter
   * @param amount - Amount to increment by
   */
  increment(amount: number): void {
    this.count += amount;
  }
}
```

### Interfaces

```typescript
/**
 * User configuration
 */
export interface UserConfig {
  /**
   * User name
   */
  name: string;

  /**
   * User age (optional)
   */
  age?: number;
}
```

### Type Aliases

```typescript
/**
 * Result type for API calls
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Enums

```typescript
/**
 * Log levels
 */
export enum LogLevel {
  /**
   * Debug messages
   */
  DEBUG = 'debug',
  /**
   * Info messages
   */
  INFO = 'info',
  /**
   * Error messages
   */
  ERROR = 'error'
}
```

## JSDoc Tags

### Supported Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `@param` | Parameter description | `@param name - User's name` |
| `@returns` | Return value description | `@returns User object` |
| `@example` | Code example | `@example add(1, 2) // 3` |
| `@deprecated` | Deprecation notice | `@deprecated Use newFunc() instead` |
| `@since` | Version introduced | `@since 1.2.0` |
| `@experimental` | Experimental API flag | `@experimental` |
| `@category` | Group APIs by category | `@category Utilities` |

### Best Practices

#### 1. Always Document Public APIs

```typescript
/**
 * Good: Comprehensive JSDoc
 * @param input - Input string to process
 * @returns Processed output
 */
export function process(input: string): string {
  return input.trim();
}
```

#### 2. Use @example for Usage

```typescript
/**
 * Format a date
 * @param date - Date to format
 * @param format - Format string
 * @returns Formatted date
 * @example
 * formatDate(new Date(), 'YYYY-MM-DD')
 * // "2025-01-15"
 */
export function formatDate(date: Date, format: string): string {
  // ...
}
```

#### 3. Mark Deprecated APIs

```typescript
/**
 * Old function
 * @deprecated Use newFunction() instead. Will be removed in v2.0.
 */
export function oldFunction(): void {
  // ...
}
```

#### 4. Use @category for Organization

```typescript
/**
 * String utility
 * @category String Utilities
 */
export function trim(str: string): string {
  return str.trim();
}

/**
 * Number utility
 * @category Math Utilities
 */
export function round(num: number): number {
  return Math.round(num);
}
```

## CLI Reference

### Command

```bash
docs-engine generate-api [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-e, --entry-points <paths...>` | Files or glob patterns to parse | `src/**/*.ts` |
| `-o, --output-dir <path>` | Output directory for markdown | `docs/api` |
| `-t, --tsconfig <path>` | Path to tsconfig.json | Auto-detect |
| `--exclude <patterns...>` | Patterns to exclude | - |
| `--base-url <url>` | Base URL for type links | - |
| `--repo-url <url>` | Repository URL for source links | - |
| `--repo-branch <branch>` | Repository branch | `main` |
| `--source-links` | Include links to source code | `false` |
| `--no-index` | Skip generating index file | `false` |

### Examples

#### Basic Usage

```bash
# Generate API docs from src directory
npx docs-engine generate-api

# Specify custom entry points
npx docs-engine generate-api \
  --entry-points "src/lib/**/*.ts" "src/utils/**/*.ts"

# Custom output directory
npx docs-engine generate-api --output-dir docs/reference
```

#### With Source Links

```bash
npx docs-engine generate-api \
  --repo-url https://github.com/user/repo \
  --repo-branch develop \
  --source-links
```

#### Exclude Files

```bash
npx docs-engine generate-api \
  --entry-points "src/**/*.ts" \
  --exclude "**/*.test.ts" "**/*.spec.ts" "**/internal/**"
```

#### With Type Linking

```bash
npx docs-engine generate-api \
  --base-url "/api" \
  --output-dir docs/api
```

## Programmatic API

### parseApi()

Parse TypeScript files and extract API information.

```typescript
import { parseApi } from '@goobits/docs-engine/server';

const result = parseApi({
  entryPoints: ['src/**/*.ts'],
  tsConfigPath: './tsconfig.json',
  exclude: ['**/*.test.ts']
});

console.log(result); // ParsedApiFile[]
```

### generateMarkdown()

Generate markdown for a single API item.

```typescript
import { generateMarkdown } from '@goobits/docs-engine/server';

const markdown = generateMarkdown(apiItem, {
  baseUrl: '/api',
  includeSourceLinks: true,
  repoUrl: 'https://github.com/user/repo',
  repoBranch: 'main'
});
```

### generateApiDocFile()

Generate a complete markdown file for a parsed source file.

```typescript
import { generateApiDocFile } from '@goobits/docs-engine/server';

const { content, fileName } = generateApiDocFile(parsedFile, {
  baseUrl: '/api',
  includeSourceLinks: true
});
```

## Integration with docs-engine

### 1. Generate API Docs

```bash
# Generate API documentation
npx docs-engine generate-api \
  --entry-points "src/lib/**/*.ts" \
  --output-dir docs/api
```

### 2. Include in Navigation

Add to your docs-engine configuration:

```typescript
// src/routes/docs/[...slug]/+page.server.ts
export const load = async ({ params }) => {
  // Include API docs in navigation
  const sections = [
    { title: 'Guide', pages: [...] },
    {
      title: 'API Reference',
      pages: [
        { title: 'Functions', slug: 'api/functions' },
        { title: 'Classes', slug: 'api/classes' },
        { title: 'Interfaces', slug: 'api/interfaces' }
      ]
    }
  ];
};
```

### 3. Manual + Auto-Generated Docs

You can mix hand-written guides with auto-generated API references:

```
docs/
  getting-started.md       # Manual
  guides/
    authentication.md      # Manual
    best-practices.md      # Manual
  api/
    index.md               # Auto-generated
    functions.md           # Auto-generated
    classes.md             # Auto-generated
```

## Output Structure

### File Organization

```
docs/api/
  index.md              # Overview with links to all modules
  utils.md              # API docs for src/utils.ts
  parser.md             # API docs for src/parser.ts
  config.md             # API docs for src/config.ts
```

### Index File

The auto-generated index file provides:

- List of all modules
- Exported items per module (functions, classes, interfaces, types, enums)
- Quick navigation

## Advanced Configuration

### Custom Type Link Mappings

```typescript
import { generateMarkdown } from '@goobits/docs-engine/server';

const markdown = generateMarkdown(item, {
  typeLinks: {
    'ParsedContent': '/api/types#parsedcontent',
    'UserConfig': '/api/config#userconfig',
    'Request': 'https://developer.mozilla.org/en-US/docs/Web/API/Request'
  }
});
```

### Grouping by Category

Use `@category` JSDoc tag to organize APIs:

```typescript
/**
 * String utility
 * @category String Utilities
 */
export function trim(str: string): string { }

/**
 * Math utility
 * @category Math Utilities
 */
export function round(num: number): number { }
```

Generated markdown will group items by category:

```markdown
# String Utilities

## trim
...

# Math Utilities

## round
...
```

## Performance

- **Fast parsing**: Leverages TypeScript Compiler API (ts-morph)
- **Incremental generation**: Only regenerates changed files (planned)
- **Parallel processing**: Processes multiple files concurrently (planned)

## Comparison with Alternatives

| Feature | docs-engine | TypeDoc | API Extractor |
|---------|-------------|---------|---------------|
| Markdown output | ✅ | ❌ (HTML) | ✅ |
| JSDoc support | ✅ | ✅ | ✅ |
| Type linking | ✅ | ✅ | ✅ |
| Custom grouping | ✅ @category | ❌ | ✅ |
| SvelteKit integration | ✅ Native | ⚠️ Manual | ⚠️ Manual |
| Source links | ✅ | ✅ | ✅ |
| Watch mode | 🚧 Planned | ✅ | ❌ |

## Troubleshooting

### "No API items found"

**Problem**: The generator found no exported items.

**Solutions**:
- Ensure files use `export` keyword
- Check entry points glob patterns
- Verify tsconfig.json path
- Remove overly broad exclude patterns

### "Cannot find module 'ts-morph'"

**Problem**: ts-morph dependency not installed.

**Solution**:
```bash
pnpm add -D ts-morph
```

### Generated docs missing type information

**Problem**: Types appear as `any`.

**Solution**:
- Ensure tsconfig.json is provided
- Check that your TypeScript project compiles without errors
- Use explicit type annotations

### JSDoc comments not appearing

**Problem**: Descriptions are missing in generated docs.

**Solution**:
- Ensure JSDoc comments are above exported declarations
- Use `/**` (not `//` or `/*`)
- Check JSDoc syntax (e.g., `@param name - description`)

## Best Practices

### 1. Consistent JSDoc Style

Use a consistent format across your codebase:

```typescript
/**
 * Brief one-line description
 *
 * Longer description with details if needed.
 * Can span multiple lines.
 *
 * @param name - Parameter description
 * @returns Return value description
 * @example
 * exampleUsage()
 */
```

### 2. Organize with @category

Group related APIs:

```typescript
// All string utilities
/**
 * @category String Utilities
 */
export function trim(s: string): string { }

/**
 * @category String Utilities
 */
export function capitalize(s: string): string { }
```

### 3. Mark Experimental Features

```typescript
/**
 * New experimental API
 * @experimental This API may change in future versions
 */
export function experimentalFeature(): void { }
```

### 4. Deprecation Path

Provide migration guidance:

```typescript
/**
 * Old API
 * @deprecated Use newAPI() instead. This will be removed in v2.0.0.
 * @example
 * // Before
 * oldAPI()
 *
 * // After
 * newAPI()
 */
export function oldAPI(): void { }
```

### 5. Rich Examples

Provide multiple examples:

```typescript
/**
 * Parse configuration
 * @param input - Config string
 * @returns Parsed config
 * @example
 * // Simple usage
 * parseConfig('key=value')
 *
 * @example
 * // Complex usage
 * parseConfig('key1=value1\nkey2=value2')
 */
```

## Roadmap

- [x] TypeScript parsing with ts-morph
- [x] Markdown generation
- [x] JSDoc tag support
- [x] Type linking
- [x] Grouping by category
- [x] CLI command
- [x] Source code links
- [x] Comprehensive tests
- [ ] Watch mode for auto-regeneration
- [ ] Custom markdown templates
- [ ] Build integration (auto-generate on build)
- [ ] Incremental generation
- [ ] Interactive API explorer
- [ ] Search integration

## Contributing

Contributions welcome! Areas for improvement:

1. **Templates**: Customizable markdown templates
2. **Watch Mode**: Auto-regenerate on file changes
3. **Build Integration**: Generate during SvelteKit build
4. **Examples**: Auto-generate usage examples from types
5. **Search**: Integration with docs-engine search

## License

MIT

---

**Generated by docs-engine API Documentation Generator**
