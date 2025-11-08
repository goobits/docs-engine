# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-07

### ⚠️ BREAKING CHANGES

#### CSS Architecture Migration to Modern CSS

- **Removed all SCSS files** - Project now uses 100% modern CSS with native nesting
- **Removed legacy token aliases** - All `--md-*` tokens removed, use W3C tokens instead
  - `--md-spacing-md` → `--space-4`
  - `--md-font-size-lg` → `--font-size-lg`
  - `--md-text-primary` → `--color-text-primary`
- **Removed legacy class names** - `.symbol-ref` removed, use `.symbol` instead
- **Updated package exports** - `./styles` now points to `./dist/styles/index.css` (was `index.scss`)
- **Browser requirements** - Requires browsers with CSS nesting support:
  - Chrome 112+
  - Safari 16.5+
  - Firefox 117+

### Added

#### CSS Architecture
- **W3C Design Token System** ([#1a6bc47](https://github.com/goobits/docs-engine/commit/1a6bc47))
  - Complete color system with HSL values (60+ tokens)
  - 8pt grid spacing system (48 tokens)
  - Modular typography scale (30+ tokens)
  - Semantic color naming
  - Dark theme support
  - Z-index scale and breakpoint tokens

- **BEM Component Architecture** ([#43fa01e](https://github.com/goobits/docs-engine/commit/43fa01e))
  - `_symbol.css` - Symbol reference component (284 lines)
  - `_callout.css` - Callout boxes with 9 color variants (229 lines)
  - `_code-tabs.css` - Tabbed code interface (66 lines)
  - `_filetree.css` - Interactive file tree (190 lines)
  - `_mermaid.css` - Diagram container (38 lines)
  - `_code-block.css` - Enhanced code blocks with diff support (181 lines)

#### Security
- **XSS Protection** ([#5d2c158](https://github.com/goobits/docs-engine/commit/5d2c158))
  - DOMPurify integration for HTML sanitization
  - Fixed XSS vulnerabilities in all components
  - 24 comprehensive security tests

- **SSRF Protection** ([#5f9e1c9](https://github.com/goobits/docs-engine/commit/5f9e1c9))
  - URL allowlist validation for screenshot service
  - Prevents server-side request forgery attacks

- **Path Traversal Protection** ([#6852fd1](https://github.com/goobits/docs-engine/commit/6852fd1))
  - File path validation in image processor
  - Prevents unauthorized file system access

- **Security Headers & Rate Limiting** ([#9a5a9aa](https://github.com/goobits/docs-engine/commit/9a5a9aa))
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options
  - Sliding window rate limiting

#### Performance
- **Parallel Image Processing** ([#fb23949](https://github.com/goobits/docs-engine/commit/fb23949))
  - 4x faster image optimization with p-limit
  - Controlled concurrency for better resource usage

- **O(n²) → O(n log n) Navigation Sorting** ([#a69dbb5](https://github.com/goobits/docs-engine/commit/a69dbb5))
  - 11x faster navigation sorting
  - Pre-computed order maps for O(1) lookups

- **Git Cache Memory Leak Fix** ([#bb8d454](https://github.com/goobits/docs-engine/commit/bb8d454))
  - Replaced unbounded Map with LRU cache
  - 90% memory reduction
  - Added retry logic with exponential backoff

#### Development Infrastructure
- **ESLint 9.x Configuration** ([#84ec8e9](https://github.com/goobits/docs-engine/commit/84ec8e9))
  - Flat config format
  - Security rules enabled
  - TypeScript + Svelte support

- **Prettier + Pre-commit Hooks** ([#1f0536a](https://github.com/goobits/docs-engine/commit/1f0536a))
  - Husky integration
  - lint-staged for automatic formatting
  - Consistent code style across project

- **Renovate Bot** ([#03c552f](https://github.com/goobits/docs-engine/commit/03c552f))
  - Automated dependency updates
  - Auto-merge patch updates
  - Monthly grouping for minor/major updates

#### Testing
- **Comprehensive Test Suite** ([#f0f186c](https://github.com/goobits/docs-engine/commit/f0f186c))
  - 181 passing tests
  - 40% coverage threshold on critical files
  - Sanitization tests (24 tests, 100% coverage)
  - Rate limiter tests (11 tests)
  - Markdown processing tests (38 tests)
  - Vitest with v8 coverage

### Changed

- **Build Configuration** - Updated tsup to copy `.css` files instead of `.scss`
- **CLI Version Management** - CLI now reads version from its own package.json
- **Package Files** - Removed SCSS files from distribution, CSS-only

### Removed

- **SCSS Files**
  - `base.scss` (869 lines)
  - `index.scss` (21 lines)
  - `symbol-ref.scss` (166 lines)
  - All SCSS preprocessor dependencies

- **Legacy Support**
  - Removed all `--md-*` token aliases
  - Removed `.symbol-ref` class (use `.symbol`)
  - Removed backward compatibility shims

### Migration Guide

#### 1. Update Import Path
```diff
- import '@goobits/docs-engine/styles/index.scss';
+ import '@goobits/docs-engine/styles/index.css';
```

#### 2. Update Token Names
```diff
.custom-component {
-  padding: var(--md-spacing-md);
+  padding: var(--space-4);

-  font-size: var(--md-font-size-lg);
+  font-size: var(--font-size-lg);

-  color: var(--md-text-primary);
+  color: var(--color-text-primary);
}
```

#### 3. Update Class Names
```diff
- <a class="symbol-ref symbol-ref--type">TypeName</a>
+ <a class="symbol symbol--type">TypeName</a>
```

#### 4. Verify Browser Support
Ensure your target browsers support CSS nesting:
- Chrome 112+ ✅
- Safari 16.5+ ✅
- Firefox 117+ ✅

## [1.0.0] - 2024-12-XX

Initial release of @goobits/docs-engine - Battery-included documentation system for SvelteKit

### Features
- Markdown rendering with MDX support
- Screenshot generation with Playwright
- Full-text search with MiniSearch
- Symbol map generation for TypeScript projects
- Code syntax highlighting with Shiki
- Math rendering with KaTeX
- Mermaid diagram support
- Documentation versioning
- Link checking and validation
- OpenAPI documentation integration

[2.0.0]: https://github.com/goobits/docs-engine/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/goobits/docs-engine/releases/tag/v1.0.0
