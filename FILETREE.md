# File Tree Plugin

Display interactive file trees in your markdown documentation.

## Quick Start

### Configure MDSveX

Add the plugin to your `svelte.config.js`:

```javascript
import { mdsvex } from 'mdsvex';
import { filetreePlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [filetreePlugin],
    }),
  ],
};
```

### Add Hydrator to Layout

In your layout component (e.g., `+layout.svelte`):

```svelte
<script>
  import { FileTreeHydrator } from '@goobits/docs-engine/components';
</script>

<FileTreeHydrator />

<slot />
```

### Import Styles

In your main CSS/SCSS file:

```scss
@import '@goobits/docs-engine/styles/base.scss';
```

## Usage

### Basic Syntax

Use a code block with the `filetree` language:

````markdown
```filetree
src/
├── lib/
│   ├── components/
│   │   ├── Button.svelte
│   │   └── Input.svelte
│   └── utils/
│       └── helpers.ts
└── app.html
```
````

### Folder vs File

- **Folders** end with a forward slash `/`
- **Files** don't end with a slash

```
src/           <- Folder
├── lib/       <- Folder
│   └── utils.ts  <- File
└── main.ts    <- File
```

### Tree Characters

Supported ASCII tree characters:

- `├──` - Branch (has more siblings below)
- `└──` - Last branch (no more siblings)
- `│` - Vertical line (continuation)
- Indentation: 4 spaces per level

## Examples

### Simple Project

````markdown
```filetree
my-app/
├── src/
│   ├── index.ts
│   └── styles.css
├── package.json
└── README.md
```
````

### Nested Structure

````markdown
```filetree
packages/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.svelte
│   │   │   └── Input.svelte
│   │   └── main.ts
│   └── package.json
└── server/
    ├── api/
    │   ├── routes.ts
    │   └── models.ts
    └── package.json
```
````

### Multiple File Types

````markdown
```filetree
project/
├── frontend/
│   ├── App.tsx
│   ├── main.ts
│   ├── styles.scss
│   └── utils.js
├── backend/
│   ├── server.py
│   ├── config.yaml
│   └── requirements.txt
├── .gitignore
├── .env
├── docker-compose.yml
└── README.md
```
````

## Configuration

### Props

Configure the FileTree component via the hydrator:

```svelte
<FileTreeHydrator
  allowCopy={true}
  githubUrl="https://github.com/user/repo/tree/main"
/>
```

**Props:**
- `allowCopy` (boolean, default: `true`) - Enable click-to-copy paths
- `githubUrl` (string, optional) - Base GitHub URL for "Open in GitHub" button

### GitHub Integration

When `githubUrl` is provided, users can click a button to open files in GitHub:

```svelte
<FileTreeHydrator
  githubUrl="https://github.com/myorg/myrepo/tree/main"
/>
```

This enables an "Open in GitHub" button on hover for each file/folder.

## Features

### File Type Detection

The plugin automatically detects 25+ file types with appropriate icons and colors:

**Languages**: TypeScript (`.ts`, `.tsx`), JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`), Svelte (`.svelte`)

**Styles**: CSS (`.css`), SCSS/SASS (`.scss`, `.sass`)

**Markup**: HTML (`.html`), SVG (`.svg`)

**Documentation**: Markdown (`.md`, `.mdx`)

**Config**: JSON/YAML (`.json`, `.yaml`, `.yml`), Environment (`.env`)

**Build**: Package files (`package.json`, `tsconfig.json`), Lock files (`.lock`)

**Git**: Git files (`.gitignore`)

**Shell**: Shell scripts (`.sh`, `.bash`, `.zsh`)

**Folders**: All folders (cyan color)

### Interactions

**Expand/Collapse**: Click arrows to expand/collapse folders (all expanded by default)

**Copy Path**: Click file or folder names to copy paths to clipboard

**Hover Effects**: Row highlighting, GitHub button (if configured)

### Accessibility

- Proper ARIA attributes (`role="tree"`, `aria-expanded`)
- Keyboard navigable
- Screen reader friendly
- Semantic HTML structure

### Mobile Support

Responsive design with:
- Horizontal scroll for wide trees
- Touch-friendly tap targets
- Optimized spacing for small screens
- Reduced font sizes on mobile

## Styling

### CSS Variables

Customize colors using CSS variables:

```css
:root {
  /* Surfaces */
  --md-surface-base: rgba(255, 255, 255, 0.03);
  --md-surface-raised: rgba(255, 255, 255, 0.06);

  /* Text */
  --md-text-primary: rgba(255, 255, 255, 0.95);
  --md-text-secondary: rgba(255, 255, 255, 0.7);
  --md-text-accent: rgb(0, 122, 255);

  /* Borders */
  --md-border-subtle: rgba(255, 255, 255, 0.06);

  /* Spacing */
  --md-spacing-xs: 0.25rem;
  --md-spacing-sm: 0.5rem;
  --md-spacing-md: 1rem;
  --md-spacing-lg: 1.5rem;

  /* Typography */
  --md-font-mono: 'SF Mono', Monaco, monospace;
  --md-font-size-sm: 0.875rem;

  /* Effects */
  --md-duration-fast: 200ms;
  --md-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
}
```

### Custom Styles

Override component styles:

```css
/* Container */
.md-filetree {
  background: var(--custom-bg);
  border-radius: 12px;
}

/* Folder names */
.md-filetree__name--folder {
  color: var(--custom-folder-color);
  font-weight: 700;
}

/* File icons */
.md-filetree__icon {
  font-size: 1.2em;
}
```

## Programmatic Usage

```svelte
<script>
  import { FileTree } from '@goobits/docs-engine/components';
  import { parseTree } from '@goobits/docs-engine/utils';

  const treeString = `
src/
├── lib/
│   └── utils.ts
└── main.ts
  `;

  const data = parseTree(treeString);
</script>

<FileTree
  {data}
  allowCopy={true}
  githubUrl="https://github.com/user/repo/tree/main"
/>
```

## Custom File Types

Extend the file type configuration:

```typescript
import { FILE_TYPES } from '@goobits/docs-engine/utils';

// Add custom type
FILE_TYPES['.vue'] = {
  icon: '🟩',
  color: '#42b883'
};

// Override existing type
FILE_TYPES['.ts'] = {
  icon: '🔷',
  color: '#007acc'
};
```

## Troubleshooting

**Tree not rendering?** Verify plugin is added to MDSveX config, hydrator is imported in layout, and styles are imported.

**Indentation issues?** Use 4 spaces per level. Don't mix tabs and spaces.

**Copy not working?** Check `allowCopy={true}` in hydrator and ensure HTTPS (clipboard API requirement).

## Performance

The file tree plugin is optimized for:

- **Small overhead**: Base64 encoding is minimal
- **Fast rendering**: CSS-based animations
- **Lazy mounting**: Components mount on demand
- **Efficient updates**: Minimal DOM manipulation

For very large trees (1000+ files), consider:
- Breaking into multiple smaller trees
- Using collapsible sections
- Lazy loading nested folders

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern mobile browsers

**Required APIs**:
- Clipboard API (for copy feature)
- CSS Custom Properties
- ES6+ JavaScript

## License

MIT - Part of @goobits/docs-engine package
