# @goobits/docs-engine

Battery-included documentation system for SvelteKit projects.

## Features
- 📝 Markdown rendering with Shiki syntax highlighting
- 📸 Automated screenshot generation with version-based caching
- 🔍 Built-in search functionality
- 🎨 Customizable theming with CSS variables
- 🧩 MDsveX plugins (screenshots, callouts, mermaid, tabs, filetree)
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
    ScreenshotHydrator,
  } from '@goobits/docs-engine/components';
</script>

<CodeTabsHydrator theme="dracula" />
<FileTreeHydrator allowCopy={true} />
<ScreenshotHydrator />

<slot />
```

### 3. Import Styles

```scss
@import '@goobits/docs-engine/styles';
```

## Documentation

- [File Tree Plugin](./FILETREE.md)
- Full documentation coming soon...

## License

MIT
