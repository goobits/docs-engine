---
title: Code Highlighting Plugin
description: Syntax highlighting with Shiki, line numbers, and line highlighting
section: Plugins
difficulty: beginner
tags: [plugin, code, highlighting, shiki]
---

# Code Highlighting Plugin

Syntax highlighting with Shiki, line numbers, and line highlighting.

## Quick Start

### Add to MDSveX Config

```javascript
import { codeHighlightPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        codeHighlightPlugin({
          theme: 'dracula',
          showLineNumbers: false
        }),
        // ... other plugins
      ],
    }),
  ],
};
```

---

## Configuration

> **Note:** You can configure code highlighting in multiple ways depending on your setup.

:::tabs
```typescript
// TypeScript configuration
interface CodeHighlightOptions {
  theme?: string;           // Default: 'dracula'
  showLineNumbers?: boolean; // Default: false
}
```

```javascript
// JavaScript configuration
codeHighlightPlugin({
  theme: 'dracula',
  showLineNumbers: false
})
```
:::

### Available Themes

- `dracula` - Dark theme with vibrant colors
- `github-dark` - GitHub dark theme
- `github-light` - GitHub light theme
- `monokai` - Classic Monokai
- `nord` - Nord color scheme
- `one-dark-pro` - VS Code One Dark Pro
- `solarized-dark` - Solarized dark
- `solarized-light` - Solarized light

```javascript
codeHighlightPlugin({
  theme: 'nord'
})
```

---

## Features

### Syntax Highlighting

Automatically highlights code based on language:

````markdown
```typescript
interface User {
  name: string;
  email: string;
}
```
````

### Line Numbers

Enable line numbers globally:

```javascript
codeHighlightPlugin({
  showLineNumbers: true
})
```

### Line Highlighting

Highlight specific lines using the `{line-range}` syntax:

````markdown
```typescript {2-3}
interface User {
  name: string;    // highlighted
  email: string;   // highlighted
}
```
````

Multiple ranges:

````markdown
```typescript {1,4-6}
interface User {       // highlighted
  name: string;
  email: string;
  age?: number;        // highlighted
  role: 'admin' | 'user'; // highlighted
  createdAt: Date;     // highlighted
}
```
````

### Diff Syntax

Show additions and deletions:

````markdown
```diff
- const old = 'removed';
+ const new = 'added';
  const unchanged = 'stays';
```
````

---

## Supported Languages

Shiki supports 100+ languages including:

**Web**: JavaScript, TypeScript, HTML, CSS, SCSS, JSON
**Backend**: Python, Ruby, PHP, Go, Rust, Java, C#
**Shell**: Bash, PowerShell, Zsh
**Data**: SQL, GraphQL, YAML, TOML
**Docs**: Markdown, MDX
**Config**: Dockerfile, Nginx, Apache

Full list: [Shiki Languages](https://github.com/shikijs/shiki/blob/main/docs/languages.md)

---

## Examples

### TypeScript with Line Numbers

````markdown
```typescript {showLineNumbers}
export async function load() {
  const data = await fetch('/api/data');
  return { data };
}
```
````

### Highlighted Lines

````markdown
```javascript {2,5-7}
function calculateTotal(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.1;

  return {
    subtotal,
    tax,
    total: subtotal + tax
  };
}
```
````

### Diff Example

````markdown
```diff
  function greet(name) {
-   console.log('Hello ' + name);
+   console.log(`Hello ${name}`);
  }
```
````

---

## File Titles

Add file path as title:

````markdown
```typescript
// src/routes/+page.server.ts
export const load = async () => {
  return { message: 'Hello' };
};
```
````

---

## Copy Button

Code blocks automatically include a copy button (styled via CSS).

Customize appearance:

```css
.code-block__copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.code-block__copy:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

---

## Best Practices

1. **Always specify language** - Enables proper highlighting
2. **Use line highlighting sparingly** - Only for key lines
3. **Keep code blocks concise** - 10-20 lines ideal
4. **Add file paths for context** - Show where code lives
5. **Use consistent theme** - Match your site's design

---

## Performance

Shiki performs syntax highlighting at build time (zero runtime cost):

- No JavaScript needed for highlighting
- Pre-rendered HTML with inline styles
- Fast page loads
- Works without JavaScript

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Code Tabs](./code-tabs.md) - Tabbed code examples

**Related:**
- [Shiki Documentation](https://shiki.matsu.io/) - Complete theme and language reference
