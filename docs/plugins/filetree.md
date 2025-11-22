---
title: File Tree Plugin
description: Display interactive file trees in your markdown documentation
section: Plugins
difficulty: beginner
tags: [plugin, markdown, filetree, ui]
---

# File Tree Plugin

Display interactive file trees in your markdown documentation.

## Quick Start

### Configure MDSveX

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

```svelte
<script>
  import { FileTreeHydrator } from '@goobits/docs-engine/components';
</script>

<FileTreeHydrator />

<slot />
```

### Import Styles

```css
@import '@goobits/docs-engine/styles';
```

---

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

---

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

**Result:**

```filetree
my-app/
├── src/
│   ├── index.ts
│   └── styles.css
├── package.json
└── README.md
```

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

**Result:**

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

---

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

---

## Features

### File Type Detection

The plugin automatically detects 25+ file types with appropriate icons and colors:

**Languages**: TypeScript, JavaScript, Svelte
**Styles**: CSS, SCSS/SASS
**Markup**: HTML, SVG
**Documentation**: Markdown
**Config**: JSON/YAML, Environment
**Build**: Package files, Lock files
**Git**: Git files
**Shell**: Shell scripts
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

---

## Troubleshooting

:::collapse{title="Tree not rendering?"}

**Check these common issues:**

1. **Plugin configuration** - Verify plugin is added to MDSveX config:
   ```javascript
   remarkPlugins: [filetreePlugin()]
   ```

2. **Hydrator component** - Ensure hydrator is imported in your layout:
   ```svelte
   import { FileTreeHydrator } from '@goobits/docs-engine/components';
   ```

3. **Styles** - Import base styles:
   ```css
   @import '@goobits/docs-engine/styles';
   ```

:::

:::collapse{title="Indentation issues?"}

**Rules for proper indentation:**

- Use **4 spaces per level** (not tabs)
- Don't mix tabs and spaces
- Ensure tree characters align properly

**Example of correct indentation:**
```
root/
├── level1/
│   └── level2/
│       └── file.txt
└── another.txt
```

:::

:::collapse{title="Copy not working?"}

**Common causes:**

1. **Clipboard API requires HTTPS** - Check your URL starts with `https://`
2. **Props not configured** - Ensure `allowCopy={true}` in hydrator:
   ```svelte
   <FileTreeHydrator allowCopy={true} />
   ```
3. **Browser permissions** - Some browsers block clipboard access

:::

:::collapse{title="GitHub button not showing?" open=false}

The GitHub button appears on hover when you provide a `githubUrl`:

```svelte
<FileTreeHydrator
  githubUrl="https://github.com/user/repo/tree/main"
/>
```

Make sure the URL matches your repository structure.

:::

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Getting Started](../getting-started.md) - Quick start guide

**Related:**
- [Callouts Plugin](./callouts.md) - Styled note/warning boxes
