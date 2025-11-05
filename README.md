# @goobits/docs-engine

Battery-included documentation system for SvelteKit with markdown rendering, screenshots, search, and symbol references.

## Features

- **Markdown rendering** with Shiki syntax highlighting
- **Enhanced code blocks** - Line highlighting, line numbers, file titles, diff syntax
- **Math rendering** - LaTeX equations with KaTeX (inline `$...$` and display `$$...$$`)
- **Link validation** - CLI tool to check internal and external links
- **Symbol references** - Link to TypeScript types/functions with `{@Symbol}` syntax
- **Automated screenshot generation** (web + CLI)
- **Table of contents** generation with `## TOC` syntax
- **MDsveX plugins** - Callouts, mermaid, tabs, filetree, TOC, links, screenshots, references
- **Frontmatter parsing** for metadata
- **Navigation builder** utility for auto-generating doc structure
- **Responsive design** with mobile navigation
- **Customizable theming** with CSS variables

## Installation
```bash
pnpm add @goobits/docs-engine
```

## Quick Start

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

The `@goobits/docs-engine-cli` package provides command-line tools for maintaining your documentation.

### Installation

```bash
pnpm add -D @goobits/docs-engine-cli
```

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
```

Features:
- ✅ Internal link validation (files and anchors)
- 🌐 External link validation with HTTP requests
- 🎨 Beautiful color-coded output
- ⚡ Concurrent checking with configurable limits
- 🔄 CI-friendly (non-zero exit codes on failure)
- ⚙️ Configurable via `.linkcheckerrc.json`

See [CLI documentation](./packages/docs-engine-cli/README.md) for more details.

## Documentation

### Core Guides

- **[Architecture](./docs/ARCHITECTURE.md)** - Package/consumer split, integration guide, design decisions
- **[Examples](./docs/EXAMPLES.md)** - Code examples, recipes, and common patterns
- **[Diagrams](./docs/DIAGRAMS.md)** - Visual architecture diagrams and flowcharts

### Plugin Documentation

- **[Symbol References](./docs/SYMBOL-REFERENCES.md)** - Link to TypeScript symbols with `{@Symbol}` syntax
- **[Screenshots](./docs/SCREENSHOTS.md)** - Automated web and CLI screenshot generation
- **[Table of Contents](./docs/TOC.md)** - Auto-generate TOC with `## TOC` or `## TOC:3` syntax
- **[Frontmatter Parser](./docs/FRONTMATTER.md)** - Parse YAML frontmatter metadata
- **[Navigation Builder](./NAVIGATION.md)** - Auto-generate navigation from markdown files
- **[File Tree](./FILETREE.md)** - Display interactive file trees
- **[Links Plugin](./docs/LINKS.md)** - Convert top-level file links to absolute paths
- **Callouts** - Styled note/warning/info boxes
- **Mermaid** - Diagram rendering with mermaid.js
- **Code Tabs** - Tabbed code examples
- **Code Highlighting** - Syntax highlighting with Shiki

### Utilities

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

See individual documentation files for detailed usage examples.

## Architecture

The docs-engine symbol reference system is split between reusable package functionality and consumer-specific implementation:

**Package (this package):**
- Remark/rehype plugins for transforming `{@Symbol}` syntax
- Symbol resolution and rendering logic
- Type definitions and utilities

**Consumer (your project):**
- Symbol generation scripts (scan TypeScript files)
- Build pipeline integration
- Pre-commit hooks and CI validation
- Directory/file patterns to scan

See **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** for complete details on:
- What belongs where
- Integration guide
- Configuration options
- Extension points
- Design decisions

## Quick Example: Symbol References

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

See **[docs/EXAMPLES.md](./docs/EXAMPLES.md)** for complete examples.

## License

MIT
