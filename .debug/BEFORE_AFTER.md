# Callouts Plugin - Before vs After

## Overview of Changes

### Before Enhancement
- ✓ 5 callout types
- ✗ No custom titles
- ✗ Basic markdown rendering
- ✗ Limited inline element support

### After Enhancement
- ✓ 9 callout types (added 4 new)
- ✓ Custom title support
- ✓ Enhanced markdown rendering
- ✓ Full inline element support
- ✓ Nested list support
- ✓ Blockquote support
- ✓ Heading support

---

## Callout Types Comparison

### Before (5 types)
```typescript
const CALLOUT_TYPES = {
  NOTE: { icon: 'ℹ️', color: 'blue', label: 'Note' },
  TIP: { icon: '💡', color: 'green', label: 'Tip' },
  IMPORTANT: { icon: '❗', color: 'purple', label: 'Important' },
  WARNING: { icon: '⚠️', color: 'yellow', label: 'Warning' },
  CAUTION: { icon: '🔥', color: 'red', label: 'Caution' }
};
```

### After (9 types)
```typescript
const CALLOUT_TYPES = {
  NOTE: { icon: 'ℹ️', color: 'blue', label: 'Note' },
  TIP: { icon: '💡', color: 'green', label: 'Tip' },
  IMPORTANT: { icon: '❗', color: 'purple', label: 'Important' },
  WARNING: { icon: '⚠️', color: 'yellow', label: 'Warning' },
  CAUTION: { icon: '🔥', color: 'red', label: 'Caution' },
  SUCCESS: { icon: '✅', color: 'success', label: 'Success' },    // NEW
  DANGER: { icon: '🚨', color: 'danger', label: 'Danger' },       // NEW
  INFO: { icon: '💬', color: 'info', label: 'Info' },             // NEW
  QUESTION: { icon: '❓', color: 'question', label: 'Question' }  // NEW
};
```

---

## Custom Title Support

### Before
❌ **Not Supported**
```markdown
> [!NOTE]
> Content here
```
→ Always shows "Note" as the title

### After
✅ **Fully Supported**
```markdown
> [!NOTE] Custom Title
> Content here
```
→ Shows "Custom Title" instead of "Note"

**Implementation:**
```typescript
// Before - Basic regex
/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i

// After - Enhanced regex with optional custom title
/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SUCCESS|DANGER|INFO|QUESTION)\](?:\s+(.+?))?$/i
```

---

## Markdown Rendering Improvements

### Before - Basic Rendering
```typescript
function renderCalloutContent(children: BlockContent[]): string {
  return children
    .map((child) => {
      if (child.type === 'paragraph') {
        // Handle paragraphs
      } else if (child.type === 'list') {
        // Basic list handling (no nesting)
      } else if (child.type === 'code') {
        // Code blocks
      }
      return '';
    })
    .join('\n');
}
```

**Limitations:**
- ❌ No nested list support
- ❌ No blockquote support
- ❌ No heading support
- ❌ Limited inline element support

### After - Enhanced Rendering
```typescript
function renderCalloutContent(children: BlockContent[]): string {
  return children
    .map((child) => {
      if (child.type === 'paragraph') { /* ... */ }
      else if (child.type === 'list') {
        return renderList(child as any, 1);  // NEW: Nested list support
      }
      else if (child.type === 'code') { /* ... */ }
      else if (child.type === 'blockquote') {  // NEW
        const quote = child as any;
        const quoteContent = renderCalloutContent(quote.children);
        return `<blockquote>\n${quoteContent}\n</blockquote>`;
      }
      else if (child.type === 'heading') {  // NEW
        const heading = child as any;
        const level = heading.depth;
        const text = renderInlineContent(heading.children);
        return `<h${level}>${text}</h${level}>`;
      }
      return '';
    })
    .join('\n');
}

// NEW: Dedicated function for nested lists
function renderList(list: any, depth: number): string {
  const indent = '    '.repeat(depth);
  const listType = list.ordered ? 'ol' : 'ul';
  const items = list.children.map((item: any) => {
    const itemParts: string[] = [];
    item.children.forEach((itemChild: any) => {
      if (itemChild.type === 'paragraph') { /* ... */ }
      else if (itemChild.type === 'list') {
        // Recursive nested list handling
        itemParts.push('\n' + renderList(itemChild, depth + 1));
      }
      // ... more item types
    });
    return `${indent}  <li>${itemParts.join('')}</li>`;
  }).join('\n');
  return `${indent}<${listType}>\n${items}\n${indent}</${listType}>`;
}
```

**New Features:**
- ✅ Nested lists with arbitrary depth
- ✅ Blockquote support
- ✅ Heading support (H1-H6)
- ✅ Code blocks in list items

---

## Inline Content Improvements

### Before - Basic Inline Support
```typescript
function renderInlineContent(children: any[]): string {
  return children.map((child) => {
    if (child.type === 'text') { /* ... */ }
    else if (child.type === 'emphasis') { /* ... */ }
    else if (child.type === 'strong') { /* ... */ }
    else if (child.type === 'inlineCode') { /* ... */ }
    else if (child.type === 'link') { /* ... */ }
    return '';
  }).join('');
}
```

**Supported:**
- ✓ Text
- ✓ Emphasis (italic)
- ✓ Strong (bold)
- ✓ Inline code
- ✓ Links

### After - Enhanced Inline Support
```typescript
function renderInlineContent(children: any[]): string {
  return children.map((child) => {
    if (child.type === 'text') { /* ... */ }
    else if (child.type === 'emphasis') { /* ... */ }
    else if (child.type === 'strong') { /* ... */ }
    else if (child.type === 'inlineCode') { /* ... */ }
    else if (child.type === 'link') {
      // NOW: Enhanced with title support
      const url = escapeHtml(child.url);
      const title = child.title ? ` title="${escapeHtml(child.title)}"` : '';
      return `<a href="${url}"${title}>${text}</a>`;
    }
    else if (child.type === 'delete') {  // NEW: Strikethrough
      const text = renderInlineContent(child.children);
      return `<del>${text}</del>`;
    }
    else if (child.type === 'image') {  // NEW: Images
      const alt = child.alt ? escapeHtml(child.alt) : '';
      const url = escapeHtml(child.url);
      const title = child.title ? ` title="${escapeHtml(child.title)}"` : '';
      return `<img src="${url}" alt="${alt}"${title}>`;
    }
    else if (child.type === 'break') {  // NEW: Line breaks
      return '<br>';
    }
    return '';
  }).join('');
}
```

**New Features:**
- ✅ Link titles
- ✅ Strikethrough (GFM)
- ✅ Images with alt/title
- ✅ Line breaks

---

## CSS Enhancements

### Before - 5 Color Variants
```scss
.md-callout--blue { /* ... */ }
.md-callout--green { /* ... */ }
.md-callout--purple { /* ... */ }
.md-callout--yellow { /* ... */ }
.md-callout--red { /* ... */ }
```

### After - 9 Color Variants
```scss
// Original 5
.md-callout--blue { /* ... */ }
.md-callout--green { /* ... */ }
.md-callout--purple { /* ... */ }
.md-callout--yellow { /* ... */ }
.md-callout--red { /* ... */ }

// New 4
.md-callout--success {
  background: var(--md-callout-success-bg);
  border-left-color: var(--md-callout-success-border);
  .md-callout__header {
    color: var(--md-callout-success-text);
  }
}

.md-callout--danger { /* ... */ }
.md-callout--info { /* ... */ }
.md-callout--question { /* ... */ }
```

---

## Real-World Example Comparison

### Before
```markdown
> [!IMPORTANT]
> You need to configure your environment.
>
> - Install Node.js
> - Set API_KEY
```

**Limitations:**
- Fixed "Important" title
- Basic list rendering
- No custom formatting

### After
```markdown
> [!IMPORTANT] Configuration Required
> Before running, configure your environment:
>
> 1. **Install Node.js** 18+
> 2. Set environment variables:
>    - `API_KEY` from your dashboard
>    - `DATABASE_URL` for PostgreSQL
> 3. Run verification:
>    ```bash
>    npm run verify
>    ```
>
> Visit [our docs](https://example.com) for more info.
```

**New Capabilities:**
- ✓ Custom title "Configuration Required"
- ✓ Ordered list with nested unordered list
- ✓ Bold text in lists
- ✓ Inline code in lists
- ✓ Code blocks with syntax highlighting
- ✓ Links
- ✓ Multiple paragraphs

---

## Documentation Improvements

### Before
```typescript
/**
 * Remark plugin to transform GitHub/Obsidian-style callouts
 *
 * Transforms blockquotes like:
 * > [!NOTE]
 * > This is a note
 *
 * Into styled HTML callouts with icons
 */
```

### After
```typescript
/**
 * Remark plugin to transform GitHub/Obsidian-style callouts
 *
 * Transforms blockquotes like:
 * > [!NOTE]
 * > This is a note
 *
 * Or with custom titles:
 * > [!TIP] Custom Title Here
 * > This is a tip with a custom title
 *
 * Supports: NOTE, TIP, IMPORTANT, WARNING, CAUTION, SUCCESS, DANGER, INFO, QUESTION
 *
 * Into styled HTML callouts with icons and enhanced markdown rendering
 */
```

---

## Summary of Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Callout Types** | 5 | 9 (+4 new) |
| **Custom Titles** | ❌ | ✅ |
| **Nested Lists** | ❌ | ✅ |
| **Blockquotes** | ❌ | ✅ |
| **Headings** | ❌ | ✅ |
| **Strikethrough** | ❌ | ✅ |
| **Images** | ❌ | ✅ |
| **Line Breaks** | ❌ | ✅ |
| **Link Titles** | ❌ | ✅ |
| **Code in Lists** | ❌ | ✅ |
| **Lines of Code** | ~150 | ~198 |
| **CSS Variables** | 15 | 27 (+12 new) |

---

## Impact

### For Users
- More expressive documentation with 9 callout types
- Ability to customize callout titles
- Richer content within callouts (lists, code, links, etc.)

### For Developers
- Better type safety with expanded type union
- More maintainable code with dedicated rendering functions
- Cleaner separation of concerns (renderList, renderInlineContent)
- Future-ready for additional callout types

### For Accessibility
- Proper ARIA labels use custom titles when provided
- Semantic HTML structure maintained
- Icons properly hidden from screen readers

---

**Enhancement completed by Agent Echo** ✨
