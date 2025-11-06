---
title: Callouts Plugin
description: Styled note, warning, tip, and info boxes with GitHub/Obsidian syntax
section: Plugins
difficulty: beginner
tags: [plugin, markdown, callouts, admonitions, github, obsidian]
---

# Callouts Plugin

Styled callout boxes using GitHub/Obsidian-compatible syntax.

## Quick Start

### Add to MDSveX Config

`````markdown
````tabs:callouts-config
tab: JavaScript
---
```javascript
import { calloutsPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [calloutsPlugin()],
    }),
  ],
};
```
---
tab: TypeScript
---
```typescript
import { mdsvex } from 'mdsvex';
import { calloutsPlugin } from '@goobits/docs-engine/plugins';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: [
    mdsvex({
      remarkPlugins: [calloutsPlugin()],
    }),
  ],
};

export default config;
```
````
`````

### Use in Markdown

```markdown
> [!NOTE]
> This is a note callout

> [!WARNING]
> This is a warning callout

> [!TIP]
> This is a tip callout
```

---

## Syntax

Callouts use blockquote syntax with `[!TYPE]` markers (GitHub/Obsidian style):

```markdown
> [!TYPE]
> Your content here
```

### Supported Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `[!NOTE]` | ℹ️ | Blue | General information |
| `[!TIP]` | 💡 | Green | Helpful suggestions |
| `[!IMPORTANT]` | ❗ | Purple | Critical information |
| `[!WARNING]` | ⚠️ | Yellow | Cautions and alerts |
| `[!CAUTION]` | 🔥 | Red | Strong warnings |
| `[!SUCCESS]` | ✅ | Success | Positive outcomes |
| `[!DANGER]` | 🚨 | Danger | Critical warnings |
| `[!INFO]` | 💬 | Info | Informational content |
| `[!QUESTION]` | ❓ | Question | Questions and FAQs |

### Custom Titles

Add custom titles after the type marker:

```markdown
> [!TIP] Pro Tip: Performance Optimization
> Enable caching to speed up builds!
```

---

## Examples

### Basic Callouts

> [!NOTE]
> Frontmatter is optional. If missing, values are derived from filename and content.

> [!TIP]
> Use caching to speed up symbol generation from 8.2s to 1.1s.

> [!WARNING]
> Do not commit `.env` files to version control. They contain sensitive credentials.

> [!IMPORTANT]
> Always test your changes before committing to main.

> [!DANGER]
> Running this command will delete all data permanently!

### With Custom Titles

> [!TIP] Performance Tip
> Binary search ($O(\log n)$) is much faster than linear search ($O(n)$) for large datasets.

> [!QUESTION] Frequently Asked
> How do I install this plugin? See the Quick Start section above!

### Multi-line Content

> [!INFO] Navigation Sorting
>
> The navigation builder sorts sections automatically:
>
> - Links within sections are sorted by the `order` field
> - Sections are sorted by the minimum `order` of their links
> - Missing `order` values default to `Infinity`

### Nested Content

Callouts support rich markdown inside:

> [!WARNING] Complex Example
>
> **Lists work:**
> - Item 1
> - Item 2
> - Item 3
>
> **Code blocks work:**
> ```typescript
> const result = await fetchData();
> ```
>
> **Even inline code works:** `npm install`

### With Math Notation

> [!NOTE] Algorithm Complexity
>
> The quicksort algorithm has time complexity:
>
> $$
> \text{Average: } O(n \log n), \quad \text{Worst: } O(n^2)
> $$

### Nested Blockquotes

> [!TIP] Documentation Tips
>
> > Always include examples!
> >
> > Users learn best by seeing code in action.

---

## All Types Showcase

> [!NOTE]
> This is a NOTE callout for general information.

> [!TIP]
> This is a TIP callout for helpful suggestions.

> [!IMPORTANT]
> This is an IMPORTANT callout for critical information.

> [!WARNING]
> This is a WARNING callout for cautions.

> [!CAUTION]
> This is a CAUTION callout for strong warnings.

> [!SUCCESS]
> This is a SUCCESS callout for positive outcomes!

> [!DANGER]
> This is a DANGER callout for critical warnings!

> [!INFO]
> This is an INFO callout for informational content.

> [!QUESTION]
> This is a QUESTION callout for FAQs.

---

## Styling

Callouts are rendered with semantic HTML and CSS classes:

```html
<div class="md-callout md-callout--blue" role="note">
  <div class="md-callout__header">
    <span class="md-callout__icon">ℹ️</span>
    <span class="md-callout__label">Note</span>
  </div>
  <div class="md-callout__content">
    <p>Your content here</p>
  </div>
</div>
```

### CSS Classes

- `.md-callout` - Base class
- `.md-callout--{color}` - Color variants (blue, green, purple, yellow, red, success, danger, info, question)
- `.md-callout__header` - Header container
- `.md-callout__icon` - Icon element
- `.md-callout__label` - Title/label text
- `.md-callout__content` - Content container

### Custom Styling

Override default styles in your global CSS:

```css
.md-callout {
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  border-left: 4px solid;
}

.md-callout--blue {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgb(59, 130, 246);
}

.md-callout--green {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgb(34, 197, 94);
}

.md-callout--purple {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgb(168, 85, 247);
}
```

---

## Real-World Examples

### API Documentation

> [!IMPORTANT] Authentication Required
>
> All API endpoints require a valid API key in the `Authorization` header:
>
> ```bash
> curl -H "Authorization: Bearer YOUR_API_KEY" \
>   https://api.example.com/users
> ```

### Configuration Guides

> [!WARNING] Environment Variables
>
> Never commit these files to version control:
> - `.env`
> - `.env.local`
> - `credentials.json`
>
> Add them to `.gitignore` instead!

### Troubleshooting

> [!QUESTION] Build failing with "Module not found"?
>
> Check these common causes:
> 1. Run `npm install` to install dependencies
> 2. Check import paths are correct
> 3. Verify file extensions match

> [!SUCCESS] Solution Found!
>
> The issue was a missing dependency. Install it with:
> ```bash
> npm install missing-package
> ```

---

## Best Practices

1. **Use appropriate types** - Match callout severity to content importance
2. **Keep concise** - 1-3 sentences ideal for quick scanning
3. **Place strategically** - Near relevant content, not at random
4. **Use sparingly** - Too many callouts reduce their impact
5. **Leverage custom titles** - Makes callouts more specific and helpful
6. **Test rendering** - Preview locally to ensure styling works

---

## Accessibility

Callouts include proper accessibility features:

- `role="note"` - Identifies callout as supplementary content
- `aria-label` - Provides accessible label (uses title or type)
- `aria-hidden="true"` - Hides decorative icons from screen readers
- Semantic HTML structure

---

## Migration from Old Syntax

> [!WARNING] Breaking Change
>
> If you used the old `> **Note:**` syntax, you need to migrate to `> [!NOTE]`.

### Old Syntax (Deprecated)
```markdown
> **Note:** This is a note
> **Warning:** This is a warning
```

### New Syntax (Correct)
```markdown
> [!NOTE]
> This is a note

> [!WARNING]
> This is a warning
```

**Migration script:**
```bash
# Find all old-style callouts
grep -r "> \*\*Note:\*\*" docs/

# Replace manually or use sed
sed -i 's/> \*\*Note:\*\* /> [!NOTE]\n> /g' your-file.md
```

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Collapse Plugin](./collapse.md) - Collapsible sections
- [Mermaid Plugin](./mermaid.md) - Diagram rendering

**Related:**
- [Getting Started](../getting-started.md) - Quick start guide
- [Plugin Order](../guides/plugin-order.md) - Understanding plugin execution
