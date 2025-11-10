---
title: Migration Guide
description: Migrate from v1.0 to v2.0 with breaking changes and upgrade instructions
section: Guides
difficulty: intermediate
tags: [migration, upgrade, breaking-changes]
order: 3
---

# Migration Guide: v1.0 → v2.0

This guide will help you migrate your project from @goobits/docs-engine v1.0 to v2.0.

**⚠️ BREAKING CHANGES** - v2.0 includes significant architectural changes. Please read this guide carefully before upgrading.

---

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Step-by-Step Migration](#step-by-step-migration)
- [CSS Token Migration](#css-token-migration)
- [Browser Requirements](#browser-requirements)
- [Troubleshooting](#troubleshooting)
- [What's New](#whats-new)

---

## Overview

Version 2.0 represents a major architectural upgrade to @goobits/docs-engine:

- **100% Modern CSS** - Removed all SCSS preprocessor dependencies
- **W3C Design Tokens** - Industry-standard token system
- **BEM Architecture** - Component-based CSS organization
- **Enhanced Security** - XSS, SSRF, and path traversal protection
- **Better Performance** - 4x faster image processing, 11x faster navigation sorting
- **Zero ESLint Errors** - Complete code quality overhaul

**Estimated Migration Time:** 15-30 minutes for most projects

---

## Breaking Changes

### 1. CSS Architecture

#### Removed SCSS Files
All `.scss` files have been removed. The project now uses 100% modern CSS with native nesting.

**Files Removed:**
- `base.scss` (869 lines)
- `index.scss` (21 lines)
- `symbol-ref.scss` (166 lines)

**Impact:** If you were importing SCSS files directly, you must update your imports.

#### Removed Legacy Token Aliases
All `--md-*` prefixed CSS custom properties have been removed in favor of W3C-compliant naming.

**Impact:** Any custom CSS using `--md-*` tokens must be updated.

#### Removed Legacy Class Names
The `.symbol-ref` class has been removed. Use `.symbol` instead.

**Impact:** Update any custom styling targeting `.symbol-ref`.

### 2. Package Exports

The `./styles` export now points to `./dist/styles/index.css` (was `./dist/styles/index.scss`).

**Impact:** Update your style imports.

### 3. Browser Requirements

Version 2.0 requires browsers with native CSS nesting support:

- **Chrome 112+** (Released April 2023)
- **Safari 16.5+** (Released May 2023)
- **Firefox 117+** (Released August 2023)

**Impact:** Users on older browsers will see unstyled content.

---

## Step-by-Step Migration

### Step 1: Update Package Version

```bash
# npm
npm install @goobits/docs-engine@^2.0.0

# pnpm
pnpm update @goobits/docs-engine@^2.0.0

# yarn
yarn upgrade @goobits/docs-engine@^2.0.0
```

### Step 2: Update Style Imports

**Before (v1.0):**
```typescript
// ❌ Old SCSS import
import '@goobits/docs-engine/styles/index.scss';
```

**After (v2.0):**
```typescript
// ✅ New CSS import
import '@goobits/docs-engine/styles/index.css';
```

Or in SvelteKit `+layout.svelte`:

```svelte
<script>
  // ✅ Update the extension
  import '@goobits/docs-engine/styles/index.css';
</script>
```

### Step 3: Update CSS Token Names

Search your codebase for `--md-` and replace with W3C tokens. See the [complete token mapping](#css-token-migration) below.

**Quick Search:**
```bash
# Find all uses of legacy tokens
grep -r "--md-" src/
```

**Common Replacements:**
```diff
.custom-component {
-  padding: var(--md-spacing-md);
+  padding: var(--space-4);

-  margin: var(--md-spacing-lg);
+  margin: var(--space-6);

-  font-size: var(--md-font-size-lg);
+  font-size: var(--font-size-lg);

-  color: var(--md-text-primary);
+  color: var(--color-text-primary);

-  background: var(--md-surface-base);
+  background: var(--color-surface);
}
```

### Step 4: Update Class Names

Replace `.symbol-ref` with `.symbol`:

```diff
- <a class="symbol-ref symbol-ref--type">TypeName</a>
+ <a class="symbol symbol--type">TypeName</a>
```

```diff
.custom-style {
-  .symbol-ref {
+  .symbol {
     /* your styles */
   }
}
```

### Step 5: Test Your Application

```bash
# Run your development server
npm run dev

# Check for console errors
# Verify styles render correctly
# Test all interactive components
```

### Step 6: Update Build Configuration (if needed)

If you have custom build configurations that reference SCSS:

**Vite/SvelteKit `vite.config.ts`:**
```diff
export default defineConfig({
  css: {
    preprocessorOptions: {
-      scss: {
-        // Remove SCSS configuration
-      }
    }
  }
});
```

**Rollup/Webpack:**
Remove any SCSS loaders or plugins that are no longer needed.

---

## CSS Token Migration

### Complete Token Mapping

#### Spacing Tokens

| v1.0 (Legacy) | v2.0 (W3C) | Value | Use Case |
|--------------|-----------|-------|----------|
| `--md-spacing-xs` | `--space-2` | 0.5rem (8px) | Small gaps, icon padding |
| `--md-spacing-sm` | `--space-3` | 0.75rem (12px) | Compact spacing |
| `--md-spacing-md` | `--space-4` | 1rem (16px) | **Default spacing** |
| `--md-spacing-lg` | `--space-6` | 1.5rem (24px) | Section spacing |
| `--md-spacing-xl` | `--space-8` | 2rem (32px) | Large gaps |
| `--md-spacing-2xl` | `--space-12` | 3rem (48px) | Extra large spacing |

**New Tokens Available:**
- `--space-px` through `--space-40` (8pt grid system)
- Fine-grained control: `--space-0-5`, `--space-1-5`, `--space-2-5`, etc.

#### Typography Tokens

| v1.0 (Legacy) | v2.0 (W3C) | Value | Use Case |
|--------------|-----------|-------|----------|
| `--md-font-size-xs` | `--font-size-xs` | 0.75rem (12px) | Captions, labels |
| `--md-font-size-sm` | `--font-size-sm` | 0.875rem (14px) | Small text |
| `--md-font-size-base` | `--font-size-base` | 1rem (16px) | Body text |
| `--md-font-size-lg` | `--font-size-lg` | 1.125rem (18px) | Large text |
| `--md-font-size-xl` | `--font-size-xl` | 1.25rem (20px) | Subheadings |
| `--md-font-size-2xl` | `--font-size-2xl` | 1.5rem (24px) | Section headings |
| `--md-font-size-3xl` | `--font-size-3xl` | 1.875rem (30px) | Page headings |
| `--md-font-mono` | `--font-family-mono` | UI monospace | Code, terminal |
| `--md-font-sans` | `--font-family-sans` | System font stack | Body text |

#### Color Tokens

| v1.0 (Legacy) | v2.0 (W3C) | Use Case |
|--------------|-----------|----------|
| `--md-text-primary` | `--color-text-primary` | Primary text color |
| `--md-text-secondary` | `--color-text-secondary` | Secondary/muted text |
| `--md-text-tertiary` | `--color-text-tertiary` | Disabled/placeholder text |
| `--md-text-accent` | `--color-text-accent` | Links, interactive elements |
| `--md-surface-base` | `--color-surface` | Card/panel backgrounds |
| `--md-surface-raised` | `--color-surface-raised` | Elevated surfaces (hover) |
| `--md-surface-elevated` | `--color-surface-elevated` | Higher elevation (modals) |
| `--md-border-subtle` | `--color-border-subtle` | Subtle borders/dividers |
| `--md-border-medium` | `--color-border-medium` | Default borders |
| `--md-border-strong` | `--color-border-strong` | Prominent borders |
| `--md-background` | `--color-background` | Page background |

**New Color System:**
- Full HSL color scales (50-900) for primary, success, warning, danger, info, purple, cyan
- Example: `--color-primary-500`, `--color-success-700`, `--color-danger-300`
- Semantic callout colors: `--color-callout-blue-bg`, `--color-callout-green-border`, etc.

#### Border Radius Tokens

| v1.0 (Legacy) | v2.0 (W3C) | Value |
|--------------|-----------|-------|
| `--md-radius-sm` | `--border-radius-sm` | 0.25rem (4px) |
| `--md-radius-md` | `--border-radius-md` | 0.375rem (6px) |
| `--md-radius-lg` | `--border-radius-lg` | 0.5rem (8px) |
| `--md-radius-xl` | `--border-radius-xl` | 0.75rem (12px) |
| `--md-radius-full` | `--border-radius-full` | 9999px |

#### Other Tokens

| Category | v1.0 (Legacy) | v2.0 (W3C) |
|----------|--------------|-----------|
| **Line Height** | `--md-line-height-tight` | `--line-height-tight` (1.25) |
| | `--md-line-height-normal` | `--line-height-normal` (1.5) |
| | `--md-line-height-relaxed` | `--line-height-relaxed` (1.75) |
| **Letter Spacing** | `--md-tracking-tight` | `--letter-spacing-tight` (-0.025em) |
| | `--md-tracking-normal` | `--letter-spacing-normal` (0) |
| | `--md-tracking-wide` | `--letter-spacing-wide` (0.025em) |
| **Font Weight** | `--md-font-weight-*` | `--font-weight-*` (400-900) |
| **Z-Index** | `--md-z-*` | `--z-index-*` (1-50) |
| **Breakpoints** | `--md-breakpoint-*` | `--breakpoint-*` (sm-2xl) |

### Migration Script

For large codebases, consider this automated migration script:

```bash
#!/bin/bash
# migrate-tokens.sh - Automate token migration

# Spacing
find src -type f \( -name "*.css" -o -name "*.svelte" -o -name "*.html" \) -exec sed -i '' \
  -e 's/--md-spacing-xs/--space-2/g' \
  -e 's/--md-spacing-sm/--space-3/g' \
  -e 's/--md-spacing-md/--space-4/g' \
  -e 's/--md-spacing-lg/--space-6/g' \
  -e 's/--md-spacing-xl/--space-8/g' \
  -e 's/--md-spacing-2xl/--space-12/g' \
  {} +

# Typography
find src -type f \( -name "*.css" -o -name "*.svelte" -o -name "*.html" \) -exec sed -i '' \
  -e 's/--md-font-size-/--font-size-/g' \
  -e 's/--md-font-mono/--font-family-mono/g' \
  -e 's/--md-font-sans/--font-family-sans/g' \
  {} +

# Colors
find src -type f \( -name "*.css" -o -name "*.svelte" -o -name "*.html" \) -exec sed -i '' \
  -e 's/--md-text-/--color-text-/g' \
  -e 's/--md-surface-base/--color-surface/g' \
  -e 's/--md-surface-raised/--color-surface-raised/g' \
  -e 's/--md-surface-elevated/--color-surface-elevated/g' \
  -e 's/--md-border-/--color-border-/g' \
  -e 's/--md-background/--color-background/g' \
  {} +

# Borders
find src -type f \( -name "*.css" -o -name "*.svelte" -o -name "*.html" \) -exec sed -i '' \
  -e 's/--md-radius-/--border-radius-/g' \
  {} +

# Other tokens
find src -type f \( -name "*.css" -o -name "*.svelte" -o -name "*.html" \) -exec sed -i '' \
  -e 's/--md-line-height-/--line-height-/g' \
  -e 's/--md-tracking-/--letter-spacing-/g' \
  -e 's/--md-font-weight-/--font-weight-/g' \
  -e 's/--md-z-/--z-index-/g' \
  -e 's/--md-breakpoint-/--breakpoint-/g' \
  {} +

# Class names
find src -type f \( -name "*.css" -o -name "*.svelte" -o -name "*.html" \) -exec sed -i '' \
  -e 's/symbol-ref/symbol/g' \
  {} +

echo "✅ Token migration complete!"
echo "⚠️  Please review changes and test thoroughly"
```

**Usage:**
```bash
chmod +x migrate-tokens.sh
./migrate-tokens.sh
git diff  # Review changes
```

---

## Browser Requirements

### Supported Browsers

v2.0 requires CSS nesting support:

| Browser | Minimum Version | Released |
|---------|----------------|----------|
| Chrome | 112+ | April 2023 ✅ |
| Edge | 112+ | April 2023 ✅ |
| Safari | 16.5+ | May 2023 ✅ |
| Firefox | 117+ | August 2023 ✅ |

### Checking Browser Support

**In Your Application:**
```javascript
// Feature detection for CSS nesting
const supportsCSSNesting = CSS.supports('selector(&)');

if (!supportsCSSNesting) {
  console.warn('Browser does not support CSS nesting. Please upgrade.');
}
```

**Browser Share (as of January 2025):**
- ✅ ~95% of global users have CSS nesting support
- ⚠️ ~5% on older browsers will see degraded styles

### Fallback Options

If you need to support older browsers:

**Option 1: Build-time PostCSS Processing**
```bash
npm install -D postcss-nested
```

```javascript
// postcss.config.js
export default {
  plugins: {
    'postcss-nested': {}, // Converts nesting to flat CSS
  }
};
```

**Option 2: Browser Warning**
```html
<!-- Add to your index.html -->
<noscript>
  <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107;">
    <strong>Browser Update Required:</strong>
    Please upgrade to a modern browser for the best experience.
  </div>
</noscript>
```

---

## Troubleshooting

### Issue: Styles Not Loading

**Symptom:** Page appears unstyled or CSS is missing.

**Solution:**
1. Check your import path:
   ```typescript
   // Make sure it's .css not .scss
   import '@goobits/docs-engine/styles/index.css';
   ```

2. Clear your build cache:
   ```bash
   rm -rf .svelte-kit node_modules/.vite
   npm install
   npm run dev
   ```

3. Check browser console for 404 errors on CSS files.

### Issue: CSS Variables Not Working

**Symptom:** Components render but colors/spacing is wrong.

**Solution:**
1. Search for legacy `--md-*` tokens in your codebase:
   ```bash
   grep -r "--md-" src/
   ```

2. Use browser DevTools to inspect elements and check computed CSS variables.

3. Ensure you're not overriding token values incorrectly.

### Issue: Symbol Reference Styles Missing

**Symptom:** Symbol references (e.g., `{@SymbolName}`) have no styling.

**Solution:**
Update class names from `.symbol-ref` to `.symbol`:
```diff
- .my-custom-symbol.symbol-ref {
+ .my-custom-symbol.symbol {
    /* styles */
  }
```

### Issue: Build Errors After Upgrade

**Symptom:** Build fails with SCSS-related errors.

**Solution:**
1. Remove any SCSS loaders or plugins from your build config
2. Check `vite.config.ts`, `rollup.config.js`, or `webpack.config.js`
3. Remove `scss` preprocessor options

### Issue: Performance Degradation

**Symptom:** Site feels slower after upgrade.

**Solution:**
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. Rebuild your app: `npm run build`
3. Check Network tab in DevTools for slow resources
4. v2.0 should be **faster** due to performance optimizations

### Getting Help

If you encounter issues not covered here:

1. **Check GitHub Issues:** https://github.com/goobits/docs-engine/issues
2. **Create a Discussion:** https://github.com/goobits/docs-engine/discussions
3. **Report a Bug:** Include:
   - Your `package.json` (versions)
   - Browser and OS
   - Error messages
   - Minimal reproduction

---

## What's New in v2.0

### 🎨 CSS Architecture

- **W3C Design Tokens** - Industry-standard token system with 200+ tokens
- **BEM Components** - Modular, maintainable CSS architecture
- **Modern CSS** - Native nesting, no preprocessor needed
- **8pt Grid System** - Consistent spacing throughout

### 🔒 Security

- **XSS Protection** - DOMPurify integration (24 tests)
- **SSRF Protection** - URL validation for screenshot service
- **Path Traversal Protection** - File path sanitization
- **Security Headers** - CSP, HSTS, X-Frame-Options
- **Rate Limiting** - Sliding window algorithm

### ⚡ Performance

- **4x Faster Image Processing** - Parallel processing with p-limit
- **11x Faster Navigation Sorting** - O(n²) → O(n log n) algorithm
- **90% Memory Reduction** - LRU cache for git operations
- **Optimized Bundle Size** - Removed SCSS dependencies

### 🧪 Quality

- **181 Passing Tests** - Comprehensive test suite
- **0 ESLint Errors** - Down from 74 errors
- **Prettier Integration** - Consistent code formatting
- **Pre-commit Hooks** - Automated quality checks

### 🛠️ Developer Experience

- **ESLint 9.x** - Modern flat config
- **Renovate Bot** - Automated dependency updates
- **Better Error Messages** - More helpful debugging
- **Improved Documentation** - This guide!

---

## Migration Checklist

Use this checklist to track your migration progress:

### Pre-Migration
- [ ] Review this migration guide completely
- [ ] Check browser support requirements
- [ ] Backup your project (`git commit`)
- [ ] Note any custom CSS using `--md-*` tokens
- [ ] Estimated migration time: ____

### Migration Steps
- [ ] Update package to v2.0: `npm install @goobits/docs-engine@^2.0.0`
- [ ] Update style import: `.scss` → `.css`
- [ ] Run migration script (or manual token replacement)
- [ ] Update class names: `.symbol-ref` → `.symbol`
- [ ] Remove SCSS build configuration (if any)
- [ ] Test on development server: `npm run dev`

### Testing
- [ ] Visual inspection (all pages look correct)
- [ ] Interactive components work (tabs, collapse, etc.)
- [ ] Console has no errors
- [ ] Run existing tests: `npm test`
- [ ] Test on target browsers (Chrome, Safari, Firefox)
- [ ] Mobile responsive check

### Post-Migration
- [ ] Update documentation (if you have internal docs)
- [ ] Run production build: `npm run build`
- [ ] Deploy to staging environment
- [ ] Monitor for issues
- [ ] Celebrate! 🎉

---

## Need Help?

- **Documentation:** https://github.com/goobits/docs-engine
- **Issues:** https://github.com/goobits/docs-engine/issues
- **Discussions:** https://github.com/goobits/docs-engine/discussions
- **Changelog:** [CHANGELOG.md](../CHANGELOG.md)

**Estimated Time Investment:**
- Small projects (< 5 custom styles): ~15 minutes
- Medium projects (5-20 custom styles): ~30 minutes
- Large projects (20+ custom styles): ~1 hour

Welcome to @goobits/docs-engine v2.0! 🚀
