# @goobits/docs-engine

Battery-included documentation system for SvelteKit projects.

## Features
- 📝 Markdown rendering with Shiki syntax highlighting
- 📸 Automated screenshot generation (web + CLI)
- 📑 Table of contents generation with `## TOC` syntax
- 🎨 Customizable theming with CSS variables
- 🧩 MDsveX plugins (callouts, mermaid, tabs, filetree, TOC, links, screenshots)
- 📊 Frontmatter parsing for metadata
- 🗺️ Navigation builder utility for auto-generating doc structure
- 📱 Responsive design with mobile navigation

## Installation
```bash
bun add @goobits/docs-engine
```

## Quick Start

### 1. Configure MDSveX

Add plugins to your `svelte.config.js`:

```javascript
import { mdsvex } from 'mdsvex';
import {
  filetreePlugin,
  calloutsPlugin,
  mermaidPlugin,
  tabsPlugin,
  codeHighlightPlugin,
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
        screenshotPlugin(),
        codeHighlightPlugin({ theme: 'dracula' }),
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

## Documentation

### Plugins

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

// Parse frontmatter from markdown
const { frontmatter, content } = parseFrontmatter(markdown);

// Build navigation from markdown files
const navigation = buildNavigation(files);
```

See individual documentation files for detailed usage examples.

## License

MIT
