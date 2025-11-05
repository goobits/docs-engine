# Modern Privacy Architecture

This document explains the privacy patterns used in docs-engine, demonstrating **true runtime privacy** using modern JavaScript/TypeScript features.

## Philosophy

**Privacy through ESM module boundaries, not just JSDoc comments.**

- ❌ **Old Way**: Export everything, mark with `@internal` JSDoc
- ✅ **New Way**: Only export public API, use true module-level privacy

## Architecture Patterns

### 1. Module-Level Privacy (Primary Pattern)

**For plugin helpers and utilities:**

```typescript
// ============================================================================
// Module-Private Helpers (True Privacy via ESM)
// ============================================================================

/**
 * Parse metadata from code fence info string
 * Module-private helper - not exported, not accessible outside this module
 */
function parseCodeMetadata(infoString: string): CodeBlockMetadata {
  // Implementation
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Remark plugin for code highlighting
 * @public
 */
export function codeHighlightPlugin(options?: Options) {
  return (tree: Root) => {
    // Can use parseCodeMetadata via closure
    const metadata = parseCodeMetadata(node.lang);
  };
}
```

**Benefits:**
- ✅ True privacy - impossible to import from outside
- ✅ No runtime overhead
- ✅ Clean exports - only public API visible
- ✅ Better treeshaking
- ✅ Idiomatic JavaScript/ESM

### 2. Class-Based Privacy with `#private`

**For stateful services (future pattern):**

```typescript
/**
 * Link validator with caching
 * @public
 */
export class LinkValidator {
  // Private fields - not accessible outside class
  #cache = new Map<string, boolean>();
  #options: ValidationOptions;
  #concurrency: number;

  constructor(options: ValidationOptions) {
    this.#concurrency = options.concurrency ?? 10;
    this.#options = options;
  }

  /**
   * Validate a link
   * @public
   */
  async validate(link: string): Promise<boolean> {
    if (this.#cache.has(link)) {
      return this.#cache.get(link)!;
    }

    const result = await this.#fetchExternal(link);
    this.#cache.set(link, result);
    return result;
  }

  /**
   * Fetch external link - private method
   */
  #fetchExternal(url: string): Promise<boolean> {
    // True privacy - not callable from outside
  }
}
```

**When to use:**
- Stateful objects (caches, registries)
- Complex lifecycle management
- Need encapsulation guarantees

### 3. Cross-Module Internal APIs

**For utilities shared between modules but not public:**

```typescript
/**
 * Escape HTML special characters
 *
 * Exported for use by other plugins, but not part of public API
 * @internal
 */
export function escapeHtml(text: string): string {
  // Implementation
}
```

**Use sparingly** - prefer duplicating simple utilities over creating cross-module dependencies.

## Refactored Files

### ✅ code-highlight.ts (Complete)

**Public exports:**
- `CodeHighlightOptions` interface
- `CodeBlockMetadata` interface
- `codeHighlightPlugin()` function

**Module-private (not exported):**
- `highlighterPromise` - singleton cache
- `parseCodeMetadata()` - helper
- `parseLineRange()` - helper
- `applyDiffStyling()` - helper
- `wrapWithMetadata()` - helper
- `applyLineHighlighting()` - helper
- `escapeHtml()` - utility

**Result:** Clean public API with 6 internal helpers truly private.

### 🔄 To Be Refactored

Following the same pattern:

1. **katex.ts** - Remove exports from `renderMath()`, `MathNode`
2. **link-validator.ts** - Convert to class with #private cache
3. **link-extractor.ts** - Module-private helpers
4. **Other plugins** - Apply same pattern

## Testing Strategy

**Test behavior, not implementation details.**

### ❌ Old Way (Testing Private Functions)

```typescript
import { parseCodeMetadata, parseLineRange } from './code-highlight';

it('should parse line range', () => {
  expect(parseLineRange('1,3-5')).toEqual([1, 3, 4, 5]);
});
```

**Problem:** Tests implementation details, couples to internal structure.

### ✅ New Way (Testing Public API)

```typescript
import { codeHighlightPlugin } from './code-highlight';

it('should parse and apply line highlighting', async () => {
  const tree: Root = {
    children: [{
      type: 'code',
      lang: 'typescript {1,3-5}',
      value: code
    }]
  };

  await codeHighlightPlugin()(tree);

  const result = tree.children[0];
  expect(result.value).toContain('class="line highlight"');
});
```

**Benefits:**
- ✅ Tests actual behavior users care about
- ✅ Allows refactoring internals without breaking tests
- ✅ More realistic integration testing
- ✅ Respects privacy boundaries

## Migration Guide

### For Plugin Authors

**Before:**
```typescript
export function internalHelper() { ... }  // @internal

export function myPlugin() {
  return (tree) => {
    internalHelper();
  };
}
```

**After:**
```typescript
// Not exported - truly private
function internalHelper() { ... }

export function myPlugin() {
  return (tree) => {
    internalHelper();  // Still accessible via closure
  };
}
```

### For Consumers

**Nothing changes!** Public API remains the same:

```typescript
import { codeHighlightPlugin } from '@goobits/docs-engine/plugins';

// Still works exactly the same
unified().use(codeHighlightPlugin, { theme: 'dracula' });
```

## Benefits

### 1. True Privacy
- Impossible to accidentally depend on internals
- Clear public API surface
- Future-proof refactoring

### 2. Better Performance
- Smaller bundle sizes (better treeshaking)
- Clearer optimization boundaries
- Less exported surface = faster builds

### 3. Developer Experience
- Autocomplete shows only public API
- Type errors only for public API
- Documentation cleaner

### 4. Dogfooding Ready
- Clear API boundaries for documentation generation
- JSDoc on public API only
- Clean module structure

## Comparison with Other Tools

| Pattern | Privacy | Performance | DX |
|---------|---------|-------------|-----|
| `@internal` JSDoc | ❌ Documentation only | ⚠️ Exports everything | ⚠️ Can still import |
| Module-private | ✅ Runtime enforced | ✅ Better treeshaking | ✅ Clean API |
| `#private` fields | ✅ Runtime enforced | ✅ No overhead | ✅ True encapsulation |

## Future Work

1. ✅ **code-highlight.ts** - Complete
2. 🔄 **katex.ts** - Apply same pattern
3. 🔄 **link-validator.ts** - Convert to class with #private
4. 🔄 **link-extractor.ts** - Module-private helpers
5. 🔄 **Legacy plugins** - Add @public to all exports

## References

- [TC39 Private Fields Proposal](https://github.com/tc39/proposal-class-fields)
- [ESM Module Privacy](https://exploringjs.com/es6/ch_modules.html)
- [TypeScript 3.8 Private Fields](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html)

---

**Summary:** We use **module-level privacy** as the primary pattern for functional code, and **#private fields** for stateful classes. JSDoc `@internal` is only for cross-module internal APIs.
