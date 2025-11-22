# @goobits/docs-engine

Documentation system for SvelteKit with markdown rendering, symbol references, and automated tooling.

## Key Features

- **Enhanced Code Blocks** - Syntax highlighting, line numbers, diff syntax, copy-to-clipboard
- **Symbol References** - Link to TypeScript types/functions with `{@Symbol}` syntax
- **Image Optimization** - Auto-generate WebP/AVIF, lazy loading, lightbox modal
- **Math Rendering** - LaTeX equations with KaTeX (inline `$...$` and display `$$...$$`)
- **API Documentation** - Auto-generate API docs from TypeScript with JSDoc
- **Link Validation** - CLI tool to check internal and external links
- **Automated Screenshots** - Web and CLI screenshot generation
- **MDsveX Plugins** - Callouts, mermaid, tabs, filetree, TOC, and more

## Quick Start

```bash
# Installation
pnpm add @goobits/docs-engine

# CLI tools (optional)
pnpm add -D @goobits/docs-engine-cli
```

### 1. Configure MDSveX

Add plugins to your `svelte.config.js`:

```javascript
import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import {
  filetreePlugin,
  calloutsPlugin,
  mermaidPlugin,
  tabsPlugin,
  codeHighlightPlugin,
  katexPlugin,
  remarkTableOfContents,
  linksPlugin,
  screenshotPlugin,
} from '@goobits/docs-engine/plugins';

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [
    mdsvex({
      remarkPlugins: [
        filetreePlugin(),
        calloutsPlugin(),
        mermaidPlugin(),
        tabsPlugin(),
        remarkTableOfContents(),
        linksPlugin(),
        referencePlugin(),      // Symbol references
        screenshotPlugin(),
        remarkMath,             // Parse math syntax
        katexPlugin(),          // Render math with KaTeX
        codeHighlightPlugin({   // Enhanced code blocks
          theme: 'dracula',
          showLineNumbers: false
        }),
      ],
    }),
  ],
};
```

### 2. Add Hydrators to Layout

In your layout component:

```svelte
<script>
  import {
    CodeTabsHydrator,
    FileTreeHydrator,
    MermaidHydrator,
    ScreenshotHydrator,
  } from '@goobits/docs-engine/components';
</script>

<CodeTabsHydrator theme="dracula" />
<FileTreeHydrator allowCopy={true} />
<MermaidHydrator />
<ScreenshotHydrator />

<slot />
```

### 3. Import Styles

```scss
@import '@goobits/docs-engine/styles';
```

## CLI Tools

### Link Checking

Validate all links in your documentation:

```bash
# Check internal links only
pnpm docs-engine check-links

# Check external links too
pnpm docs-engine check-links --external

# Quiet mode (errors only)
pnpm docs-engine check-links --quiet

# JSON output for CI
pnpm docs-engine check-links --json

# Configure via .linkcheckerrc.json
```

Validates internal links (files and anchors), external links with HTTP requests, and provides color-coded output with configurable concurrency.

See [CLI documentation](./packages/docs-engine-cli/README.md) for details.

## Documentation

**[Complete Documentation Index](./docs/index.md)** - Full documentation with learning paths

### Getting Started

- **[Getting Started](./docs/getting-started.md)** - 5-minute setup guide
- **[Plugin Order Guide](./docs/guides/plugin-order.md)** - Plugin execution order and configuration
- **[Architecture](./docs/guides/architecture.md)** - Package/consumer split and design decisions
- **[Examples](./docs/guides/examples.md)** - Code examples and common patterns

### Plugin Guides

- **[Symbol References](./docs/plugins/symbol-references.md)** - Link to TypeScript symbols with `{@Symbol}` syntax
- **[Screenshots](./docs/plugins/screenshots.md)** - Automated web and CLI screenshot generation
- **[Image Optimization](./docs/plugins/image-optimization.md)** - Auto WebP/AVIF generation with lazy loading
- **[Code Highlighting](./docs/plugins/code-highlighting.md)** - Syntax highlighting with Shiki
- **[Table of Contents](./docs/plugins/toc.md)** - Auto-generate TOC with `## TOC` syntax
- **[File Tree](./docs/plugins/filetree.md)** - Interactive file trees
- **[Callouts](./docs/plugins/callouts.md)** - Styled note/warning/info boxes
- **[Mermaid](./docs/plugins/mermaid.md)** - Diagram rendering with mermaid.js
- **[Code Tabs](./docs/plugins/code-tabs.md)** - Tabbed code examples

### JavaScript API

```javascript
import { parseFrontmatter, extractTitle } from '@goobits/docs-engine/utils';
import { buildNavigation } from '@goobits/docs-engine/utils';
import { loadSymbolMap, resolveSymbol } from '@goobits/docs-engine/utils';

// Parse frontmatter from markdown
const { frontmatter, content } = parseFrontmatter(markdown);

// Build navigation from markdown files
const navigation = buildNavigation(files);

// Resolve symbol references
const symbolMap = loadSymbolMap();
const symbol = resolveSymbol('RequestState', symbolMap);
```

## Example: Symbol References

**1. Generate symbol map (in your project):**

```bash
# Create scripts/docs/generate-symbol-map.ts
pnpm docs:symbols
```

**2. Use in markdown:**

```markdown
# API Documentation

The {@RequestState} type tracks request context.

:::reference RequestState
:::
```

**3. Rendered output:**

Links to GitHub source with hover tooltips showing type signatures.

See **[docs/guides/examples.md](./docs/guides/examples.md)** for more examples.

## Architecture

The symbol reference system separates reusable package functionality from consumer-specific implementation:

**Package (this package):**
- Remark/rehype plugins for transforming `{@Symbol}` syntax
- Symbol resolution and rendering logic
- Type definitions and utilities

**Consumer (your project):**
- Symbol generation scripts (scan TypeScript files)
- Build pipeline integration
- Pre-commit hooks and CI validation

See **[Architecture Guide](./docs/guides/architecture.md)** for integration guide and design decisions.

## License

MIT - see [LICENSE](LICENSE) for details
