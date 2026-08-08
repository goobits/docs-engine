# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ⚠️ BREAKING CHANGES

- `DocsSection.icon` (a `ComponentType`) is replaced by `DocsSection.iconName`
  (a `string`). Navigation crosses a SvelteKit server load and is JSON
  serialized, so a component could never survive that boundary. Names resolve to
  components at render time in `section-icons.ts`.
- Removed `NavigationBuilderOptions.icons`, `NavigationBuilderOptions.defaultIcon`,
  and the `IconMap` export. Section icons now come from the `icon` frontmatter of
  a section's lowest-order page. Consumers passing an icon map should move those
  icons into frontmatter.

### Added

- Section icons resolved from frontmatter through `section-icons.ts`, which
  ships `book`, `code`, `compass`, `flask`, `library`, `map`, `package`,
  `rocket`, `settings`, `shapes`, `terminal`, and `wrench`.
- `SearchModal` exposes `open()` so a host can trigger it, and `DocsSidebar`
  accepts an `onSearch` callback.

### Changed

- The sidebar search control opens the full-text search modal. It previously ran
  a separate substring filter over navigation titles, which duplicated search and
  replaced the entire navigation tree while typing.
- Sections with more than 12 links start collapsed unless they hold the current
  page, so a large reference section no longer buries every other section.
- The sidebar chevron and audience filter pills use theme tokens instead of
  hardcoded `rgba(255, 255, 255, ...)` values, which were invisible against the
  light `github` and `minimal` themes.

### Removed

- `SearchModal`'s built-in floating trigger button. It was `position: fixed` at a
  host-defined offset and could render underneath host chrome. Hosts now place
  their own control and call `open()`.
- Both duplicate navigation icon-stripping passes, which existed only to delete
  the unserializable icon field.

### Fixed

- Kept collapsible sidebar targets in the document so `aria-controls` always
  references a valid element.
- Enabled the package's existing SCSS preprocessing in standalone Svelte
  component tests, including a test-only SvelteKit page-store fixture.
- The sidebar search block is 56px tall instead of 76px, and the search icon no
  longer sits 24px from its own label.

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
