---
title: Callouts Plugin
description: Styled note, warning, tip, and info boxes for your documentation
section: Plugins
difficulty: beginner
tags: [plugin, markdown, callouts, admonitions]
---

# Callouts Plugin

Styled note, warning, tip, and info boxes for your documentation.

## Quick Start

### Add to MDSveX Config

```javascript
import { calloutsPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        calloutsPlugin(),
        // ... other plugins
      ],
    }),
  ],
};
```

### Use in Markdown

```markdown
> **Note:** This is a note callout

> **Warning:** This is a warning callout

> **Tip:** This is a tip callout

> **Info:** This is an info callout
```

---

## Syntax

Callouts use blockquote syntax with **bold** keywords:

**Available types:**
- `**Note:**` - Blue, for general information
- `**Warning:**` - Red/orange, for cautions and warnings
- `**Tip:**` - Green, for helpful tips
- `**Info:**` - Light blue, for informational content
- `**Danger:**` - Red, for critical warnings

---

## Examples

### Note

```markdown
> **Note:** Frontmatter is optional. If missing, values are derived from filename and content.
```

> **Note:** Frontmatter is optional. If missing, values are derived from filename and content.

### Warning

```markdown
> **Warning:** Do not commit `.env` files to version control. They contain sensitive credentials.
```

> **Warning:** Do not commit `.env` files to version control. They contain sensitive credentials.

### Tip

```markdown
> **Tip:** Use caching to speed up symbol generation from 8.2s to 1.1s.
```

> **Tip:** Use caching to speed up symbol generation from 8.2s to 1.1s.

### Multi-line

```markdown
> **Info:** The navigation builder sorts sections automatically.
>
> Links within sections are sorted by the `order` field.
> Sections are sorted by the minimum `order` of their links.
```

---

## Styling

Callouts are styled with CSS classes. Customize in your global styles:

```css
.callout {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
  margin: 1.5rem 0;
}

.callout--note {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgb(59, 130, 246);
}

.callout--warning {
  background: rgba(251, 146, 60, 0.1);
  border-color: rgb(251, 146, 60);
}

.callout--tip {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgb(34, 197, 94);
}
```

---

## Best Practices

1. **Use sparingly** - Too many callouts reduce their impact
2. **Place strategically** - Near relevant content
3. **Keep concise** - 1-2 sentences ideal
4. **Choose appropriate type** - Match severity to content

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Mermaid Plugin](./mermaid.md) - Diagram rendering

**Related:**
- [Getting Started](../getting-started.md) - Quick start guide
