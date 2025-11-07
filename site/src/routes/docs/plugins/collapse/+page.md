---
title: Collapse Plugin
description: Create collapsible sections with interactive details/summary elements
section: Plugins
difficulty: beginner
tags: [plugin, markdown, collapse, details, accordion]
---

# Collapse Plugin

Create collapsible sections with interactive `<details>`/`<summary>` elements for better content organization.

## Quick Start

### Add to MDSveX Config

`````markdown
````tabs:collapse-config
tab: JavaScript
---
```javascript
import { collapsePlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [collapsePlugin()],
    }),
  ],
};
```
---
tab: TypeScript
---
```typescript
import { mdsvex } from 'mdsvex';
import { collapsePlugin } from '@goobits/docs-engine/plugins';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: [
    mdsvex({
      remarkPlugins: [collapsePlugin()],
    }),
  ],
};

export default config;
```
````
`````

### Use in Markdown

```markdown
:::collapse{title="Click to expand"}
This content is hidden by default and can be toggled by clicking the summary.
:::
```

---

## Syntax

Use the `:::collapse` directive with optional attributes:

```markdown
:::collapse{title="Section Title" open=true}
Content goes here...

- Lists work
- **Bold text** works
- `Code` works too
:::
```

### Attributes

- `title` (string) - Summary text shown in the header (default: "Details")
- `open` (boolean) - Whether section is expanded by default (default: true)

---

## Examples

### Basic Collapse

```markdown
:::collapse{title="What is a remark plugin?"}
Remark plugins transform markdown AST (Abstract Syntax Tree) nodes during the build process.
:::
```

:::collapse{title="What is a remark plugin?"}
Remark plugins transform markdown AST (Abstract Syntax Tree) nodes during the build process.
:::

### Closed by Default

```markdown
:::collapse{title="Advanced Configuration" open=false}
This section is collapsed by default. Click to expand.

```javascript
codeHighlightPlugin({
  theme: 'dracula',
  showLineNumbers: true
})
```
:::
```

:::collapse{title="Advanced Configuration" open=false}
This section is collapsed by default. Click to expand.

```javascript
codeHighlightPlugin({
  theme: 'dracula',
  showLineNumbers: true
})
```
:::

### Nested Content

:::collapse{title="Troubleshooting Common Issues"}

> **Warning:** Always check plugin order first when debugging issues.

**Problem:** Collapse sections not rendering

**Solutions:**
1. Verify plugin is added to MDSveX config
2. Ensure `remark-directive` is installed
3. Check that styles are imported

**Problem:** Content not formatting correctly

**Solution:** Make sure other plugins (callouts, code highlighting) run in correct order.

:::

---

## Use Cases

### Documentation FAQs

Perfect for FAQ sections:

```markdown
:::collapse{title="How do I install this?"}
Run `npm install @goobits/docs-engine`
:::

:::collapse{title="Does it work with Vite?"}
Yes! It's built specifically for SvelteKit with Vite.
:::
```

### Long Code Examples

Hide lengthy examples until needed:

```markdown
:::collapse{title="Complete Configuration Example" open=false}
```javascript
import { mdsvex } from 'mdsvex';
import {
  filetreePlugin,
  calloutsPlugin,
  mermaidPlugin,
  tabsPlugin,
  collapsePlugin,
  remarkTableOfContents,
  linksPlugin,
  referencePlugin,
  codeHighlightPlugin,
} from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        filetreePlugin(),
        calloutsPlugin(),
        mermaidPlugin(),
        tabsPlugin(),
        collapsePlugin(),
        remarkTableOfContents(),
        linksPlugin(),
        referencePlugin(),
        codeHighlightPlugin(),
      ],
    }),
  ],
};
```
:::
```

### Troubleshooting Sections

Organize debugging information:

```markdown
:::collapse{title="Debugging Plugin Issues"}
1. Enable verbose logging
2. Check browser console
3. Verify plugin order
4. Test with minimal config
:::
```

:::collapse{title="Debugging Plugin Issues"}
1. Enable verbose logging
2. Check browser console
3. Verify plugin order
4. Test with minimal config
:::

---

## Styling

The plugin generates semantic HTML with CSS classes:

```html
<details class="md-collapse">
  <summary class="md-collapse__summary">
    <svg class="md-collapse__icon">...</svg>
    <span class="md-collapse__title">Title</span>
  </summary>
  <div class="md-collapse__content">
    Content...
  </div>
</details>
```

### Custom Styles

Override default styles in your global CSS:

```css
.md-collapse {
  margin: 1.5rem 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.md-collapse__summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  background: var(--color-surface);
  font-weight: 600;
  user-select: none;
}

.md-collapse__summary:hover {
  background: var(--color-surface-hover);
}

.md-collapse__icon {
  transition: transform 0.2s ease;
  color: var(--color-text-secondary);
}

.md-collapse[open] .md-collapse__icon {
  transform: rotate(90deg);
}

.md-collapse__content {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}
```

---

## Features

- **Native HTML** - Uses browser `<details>` element (no JavaScript required)
- **Accessible** - Full keyboard navigation support
- **Animated** - Smooth expand/collapse transitions
- **Nested content** - Supports all markdown elements inside
- **SEO friendly** - Content is in DOM, just hidden
- **Print friendly** - Expands all sections when printing

---

## Accessibility

The plugin generates accessible markup:

- **Keyboard navigation** - Space/Enter to toggle
- **Screen reader friendly** - Native `<details>` semantics
- **Focus management** - Proper focus indicators
- **ARIA attributes** - Automatically handled by browser

---

## Best Practices

1. **Use descriptive titles** - Make it clear what's inside
2. **Default open for important content** - Don't hide critical information
3. **Group related items** - Use multiple collapses for FAQs
4. **Avoid nesting** - Keep structure flat for better UX
5. **Keep content concise** - Don't hide entire pages

---

## Plugin Order

> **Note:** Collapse plugin should run early, before content processing plugins.

```javascript
remarkPlugins: [
  // Structural plugins (including collapse)
  filetreePlugin(),
  calloutsPlugin(),
  mermaidPlugin(),
  tabsPlugin(),
  collapsePlugin(), // ← Add here

  // Content plugins
  remarkTableOfContents(),
  linksPlugin(),
  referencePlugin(),

  // Code plugins (last)
  codeHighlightPlugin(),
]
```

---

## Troubleshooting

:::collapse{title="Sections not rendering?" open=false}

**Check:**
1. Plugin added to MDSveX config
2. `remark-directive` installed: `npm install remark-directive`
3. Correct syntax: `:::collapse{title="..."}` with three colons
4. Proper closing: `:::`

:::

:::collapse{title="Styles not applied?" open=false}

**Solutions:**
1. Import base styles: `@import '@goobits/docs-engine/styles/base.scss'`
2. Check CSS specificity (use browser devtools)
3. Verify CSS classes in rendered HTML

:::

:::collapse{title="Content not formatting?" open=false}

**Common causes:**
- Plugin order issues - ensure collapse runs before code highlighting
- Markdown syntax errors inside collapse
- Missing blank lines around content blocks

**Fix:** Review plugin order in the guide above.

:::

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge, understanding of directives

**Next Steps:**
- [Callouts Plugin](./callouts.md) - Styled note/warning boxes
- [Plugin Order Guide](../guides/plugin-order.md) - Understanding execution order

**Related:**
- [Code Tabs](./code-tabs.md) - Another way to organize content
- [Getting Started](../getting-started.md) - Quick start guide
