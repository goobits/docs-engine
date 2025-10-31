# Enhanced Callouts - Quick Reference

## All 9 Callout Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `NOTE` | ℹ️ | Blue | General information, helpful context |
| `TIP` | 💡 | Green | Helpful suggestions, best practices |
| `IMPORTANT` | ❗ | Purple | Critical information users must know |
| `WARNING` | ⚠️ | Yellow | Caution, potential issues |
| `CAUTION` | 🔥 | Red | High-severity warning |
| `SUCCESS` | ✅ | Green | Successful operations, confirmations |
| `DANGER` | 🚨 | Deep Red | Critical alerts, irreversible actions |
| `INFO` | 💬 | Light Blue | Additional context, background info |
| `QUESTION` | ❓ | Purple | Questions, discussion prompts |

---

## Syntax

### Default Title
```markdown
> [!TYPE]
> Content goes here
```

### Custom Title
```markdown
> [!TYPE] Your Custom Title
> Content goes here
```

---

## Examples

### Basic Usage
```markdown
> [!NOTE]
> This is a simple note.

> [!SUCCESS]
> Operation completed!

> [!DANGER]
> This cannot be undone!
```

### With Custom Titles
```markdown
> [!NOTE] Getting Started
> Follow these steps to begin.

> [!TIP] Pro Tip: Performance
> Cache your API responses for better speed.

> [!DANGER] Data Loss Warning
> Deleting this will remove all user data permanently.
```

### Rich Content
```markdown
> [!IMPORTANT] System Requirements
> Before installing, ensure you have:
>
> 1. **Node.js** 18 or higher
> 2. **PostgreSQL** 15+
> 3. At least **8GB RAM**
>
> Check versions with:
> ```bash
> node --version
> psql --version
> ```
>
> Visit [our docs](https://example.com) for more info.
```

---

## Supported Markdown Features

Inside callouts, you can use:

- **Bold** and *italic* text
- `inline code`
- [Links](https://example.com)
- Lists (ordered and unordered)
- Nested lists
- Code blocks with syntax highlighting
- Blockquotes
- Headings (H1-H6)
- Images
- ~~Strikethrough~~
- Line breaks

---

## Color Scheme

All callouts use a consistent color system with:
- **Background**: 10% opacity of accent color
- **Border**: Solid accent color (4px left border)
- **Header text**: Lighter shade of accent color
- **Hover effect**: Subtle 2px translation

---

## CSS Classes

All callouts have the base class `md-callout` plus a color variant:

- `.md-callout--blue` (NOTE)
- `.md-callout--green` (TIP, SUCCESS)
- `.md-callout--purple` (IMPORTANT)
- `.md-callout--yellow` (WARNING)
- `.md-callout--red` (CAUTION)
- `.md-callout--success` (SUCCESS)
- `.md-callout--danger` (DANGER)
- `.md-callout--info` (INFO)
- `.md-callout--question` (QUESTION)

---

## Accessibility

All callouts include:
- `role="note"` for semantic meaning
- `aria-label` with callout type/title
- `aria-hidden="true"` on decorative icons

---

## Implementation Details

**Plugin Type**: Remark/Unified plugin
**Input**: Markdown AST (blockquote nodes)
**Output**: HTML string (styled div structure)
**Pattern**: Case-insensitive `[!TYPE]` or `[!TYPE Title]`
**Rendering**: Server-side during markdown processing

---

## File Locations

- **Plugin**: `/workspace/packages/@goobits/markdown-docs/src/lib/plugins/callouts.ts`
- **Styles**: `/workspace/packages/@goobits/markdown-docs/src/lib/styles/base.scss`
- **Demo**: `/workspace/packages/@goobits/markdown-docs/.debug/callouts-showcase.html`

---

## When to Use Each Type

### NOTE (ℹ️)
General information that's helpful but not critical.

### TIP (💡)
Suggestions for better ways to do things.

### IMPORTANT (❗)
Information users absolutely need to know.

### WARNING (⚠️)
Things that could go wrong if not careful.

### CAUTION (🔥)
High-severity warnings about dangerous operations.

### SUCCESS (✅)
Confirmations that operations completed successfully.

### DANGER (🚨)
Critical alerts about irreversible or destructive actions.

### INFO (💬)
Additional context or background information.

### QUESTION (❓)
Questions to encourage critical thinking or discussion.

---

**Quick Tip**: Callouts are case-insensitive, so `[!note]`, `[!Note]`, and `[!NOTE]` all work!
