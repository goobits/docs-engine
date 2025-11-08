# Setup Issues & Solutions Log

**Date:** 2025-11-07
**Context:** Debugging plugin loading issues in @goobits/docs-engine demonstration site

## Executive Summary

The demonstration site experienced severe plugin failures due to missing peer dependencies. Container directive syntax (`:::reference`, `:::collapse`, ````tabs:`) rendered as plain text instead of being processed by plugins. This document captures the root cause, debugging journey, and solutions to prevent end users from encountering these issues.

## Root Cause

**Missing Dependency:** `remark-directive` was NOT included as a dependency in the consumer application (`site/package.json`).

### Why This Matters

- **Package Structure:** `@goobits/docs-engine` includes `remark-directive` in `/workspace/package.json` but this is the LIBRARY package
- **Consumer Requirements:** Applications using the library must install `remark-directive` separately
- **Silent Failure:** Without `remark-directive`, the import resolves to `undefined`, plugins silently fail, and directives render as plain text

### Impact

**Affected Features:**
- Reference blocks: `:::reference SymbolName` → rendered as `<p>:::reference SymbolName\n:::</p>`
- Callouts: `:::note`, `:::warning`, etc. → rendered as plain text
- Collapse sections: `:::collapse` → not functional
- Code tabs: ````tabs:langname`` → not processed
- All container-directive-based plugins failed silently

## Debugging Journey

### Issue #1: Container Directives Not Working
**Symptoms:**
- `:::reference Invalid BlockSymbol` rendered as plain text paragraph
- ````tabs:katex-config`` blocks showed raw markdown
- No error messages in console or logs

**Investigation Steps:**
1. Checked unified pipeline configuration in `site/src/routes/docs/[...slug]/+page.server.ts`
2. Verified `remarkDirective` was imported: ✅ Line 7
3. Verified `.use(remarkDirective)` in pipeline: ✅ Line 96
4. Checked for import errors in logs: ❌ None found
5. Verified package installed: ❌ **NOT in site/package.json**

**Resolution:**
```bash
# Add to site/package.json dependencies
pnpm add remark-directive
```

### Issue #2: Aggressive Module Caching
**Symptoms:**
- Code changes didn't take effect despite HMR
- Server restarts didn't pick up new dependencies
- Multiple cache clearing attempts failed

**Failed Attempts:**
1. Standard HMR refresh
2. Killing dev server and restarting
3. Clearing `.svelte-kit` cache
4. Clearing `node_modules/.vite` cache
5. Full rebuild with `pnpm build`

**What Actually Worked:**
```bash
# Nuclear option - clear ALL caches
rm -rf .svelte-kit node_modules/.vite
pnpm install  # Reinstall after adding dependency
pnpm dev
```

### Issue #3: Type Error in code-highlight.ts
**Symptom:** TypeScript error in `/workspace/src/lib/plugins/code-highlight.ts:263`

**Error:**
```
return tree;  // ❌ Wrong - function returns Promise<void>
```

**Fix:**
```typescript
return;  // ✅ Correct
```

**Impact:** This didn't prevent runtime execution but caused TypeScript compilation errors.

## Solutions for End Users

### Immediate Fix (For Existing Projects)

**Step 1: Add Required Dependencies**

Add to your project's `package.json`:

```json
{
  "dependencies": {
    "remark-directive": "^4.0.0",
    "remark-gfm": "^4.0.1",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.2",
    "rehype-stringify": "^10.0.1",
    "unified": "^11.0.5",
    "gray-matter": "^4.0.3"
  }
}
```

**Step 2: Install**
```bash
pnpm install
# or
npm install
```

**Step 3: Import in Server Load Function**

```typescript
import remarkDirective from 'remark-directive';

export const load: PageServerLoad = async ({ params }) => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)  // ⚠️ CRITICAL - Must be before custom plugins
    .use(calloutsPlugin)
    .use(referencePlugin)
    // ... other plugins
    .use(remarkRehype)
    .use(rehypeStringify);
};
```

**Step 4: Clear Caches**
```bash
rm -rf .svelte-kit node_modules/.vite
pnpm dev
```

### Long-Term Prevention

#### Option 1: Peer Dependencies (Recommended)

Update `@goobits/docs-engine/package.json`:

```json
{
  "peerDependencies": {
    "remark-directive": "^4.0.0",
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "remark-directive": {
      "optional": false
    }
  }
}
```

**Benefits:**
- Package managers warn users about missing dependencies
- Clear error messages instead of silent failures
- Prevents version conflicts

#### Option 2: Bundle Dependencies

Move all remark/unified packages to `dependencies` instead of `devDependencies`:

```json
{
  "dependencies": {
    "remark-directive": "^4.0.0",
    "unified": "^11.0.5",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.1",
    "remark-rehype": "^11.1.2",
    "rehype-stringify": "^10.0.1"
  }
}
```

**Benefits:**
- Works immediately without user configuration
- No dependency management required by consumers

**Drawbacks:**
- Larger bundle size
- Potential version conflicts if user has different versions

#### Option 3: Improved Documentation

Add to README.md and Getting Started guide:

```markdown
## Installation

\`\`\`bash
npm install @goobits/docs-engine
\`\`\`

### Required Peer Dependencies

⚠️ **Important:** You must install these dependencies separately:

\`\`\`bash
npm install remark-directive remark-parse remark-gfm unified
\`\`\`

### Why?

@goobits/docs-engine uses remark/unified plugins that must be shared with your project to avoid version conflicts and ensure proper plugin chaining.
```

## Recommended Actions

1. **Immediate:** Add peer dependencies to package.json with proper warnings
2. **Short-term:** Update documentation with explicit dependency requirements
3. **Medium-term:** Add validation script to check for required dependencies
4. **Long-term:** Consider providing a CLI setup wizard

### Validation Script Example

```typescript
// check-deps.ts
const required = ['remark-directive', 'unified', 'remark-parse'];
const missing = required.filter(dep => {
  try {
    require.resolve(dep);
    return false;
  } catch {
    return true;
  }
});

if (missing.length) {
  console.error('Missing required dependencies:');
  missing.forEach(dep => console.error(`  - ${dep}`));
  console.error('\nInstall with: npm install ' + missing.join(' '));
  process.exit(1);
}
```

## Pain Points Summary

### What Made This Hard
1. **Silent Failures:** No error messages when `remarkDirective` was undefined
2. **Aggressive Caching:** Changes didn't take effect even after multiple restarts
3. **Workspace Confusion:** Library has dependency but consumer doesn't inherit it
4. **Lack of Warnings:** pnpm didn't warn about missing peer dependencies

### What Would Have Helped
1. Explicit peer dependency warnings
2. Runtime validation of required plugins
3. Better error messages when directives aren't processed
4. Documentation emphasizing dependency requirements

## Files Modified

### Fixed Files
1. `/workspace/site/package.json` - Added `remark-directive`
2. `/workspace/site/src/routes/docs/[...slug]/+page.server.ts` - Added remarkDirective import and .use()
3. `/workspace/src/lib/plugins/code-highlight.ts:263` - Fixed return statement

### Files That Need Attention
1. `/workspace/package.json` - Should define peerDependencies
2. `/workspace/README.md` - Should document dependency requirements
3. `/workspace/docs/getting-started.md` - Should include setup instructions

## Testing Checklist

After implementing fixes, verify:

- [ ] Container directives parse correctly (`:::reference`, `:::note`, etc.)
- [ ] Code tabs render properly (````tabs:langname``)
- [ ] Inline symbol references work (`{@SymbolName}`)
- [ ] Fresh install on new project works without manual dependency hunting
- [ ] pnpm/npm warns about missing peer dependencies
- [ ] Documentation clearly lists all required dependencies

## Conclusion

This issue represents a common problem in JavaScript ecosystems: implicit peer dependency requirements. The fix is straightforward once identified, but the debugging process was painful due to silent failures.

**Key Takeaway:** Library packages that rely on plugin ecosystems (unified, remark, rehype) MUST explicitly declare peer dependencies to prevent user confusion and silent failures.
