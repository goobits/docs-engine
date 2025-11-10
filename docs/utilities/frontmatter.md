---
title: Frontmatter Parser
description: Parse YAML frontmatter from markdown files to extract metadata
section: Plugins
difficulty: beginner
tags: [plugin, markdown, frontmatter, metadata]
---

# Frontmatter Parser

Parse YAML frontmatter from markdown files to extract metadata.

## Usage

```javascript
import { parseFrontmatter, extractTitle } from '@goobits/docs-engine/utils';

const markdown = `---
title: Getting Started
description: Learn the basics
date: 2025-01-01
tags: [guide, beginner]
order: 1
---

# Content here
`;

// Parse frontmatter
const { frontmatter, content, raw } = parseFrontmatter(markdown);

console.log(frontmatter);
// {
//   title: 'Getting Started',
//   description: 'Learn the basics',
//   date: '2025-01-01',
//   tags: ['guide', 'beginner'],
//   order: 1
// }

console.log(content);
// "# Content here\n"

// Extract title with fallback logic
const title = extractTitle(frontmatter, content, 'Untitled');
// "Getting Started"
```

## API

### `parseFrontmatter(markdown)`

Extracts and parses YAML frontmatter from markdown.

**Parameters:**
- `markdown` (string) - Markdown content with frontmatter

**Returns:**
- `frontmatter` (object) - Parsed YAML object
- `content` (string) - Markdown without frontmatter
- `raw` (string) - Original markdown

**Type Definition:**

```typescript
interface ParsedContent {
  frontmatter: Frontmatter;
  content: string;
  raw: string;
}

interface Frontmatter {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  draft?: boolean;
  order?: number;
  [key: string]: any;
}
```

### `extractTitle(frontmatter, content, fallback)`

Extracts a title using priority order: frontmatter.title → first heading → fallback string.

**Parameters:**
- `frontmatter` (object) - Parsed frontmatter
- `content` (string) - Markdown content
- `fallback` (string) - Default title if none found

**Returns:** string

**Example:**

```javascript
// Uses frontmatter title
extractTitle({ title: 'Custom' }, '# Heading', 'Fallback');
// → "Custom"

// Uses first heading
extractTitle({}, '# My Page\n\nContent...', 'Fallback');
// → "My Page"

// Uses fallback
extractTitle({}, 'Content without heading', 'Fallback');
// → "Fallback"
```

## Frontmatter Format

### Standard Fields

```yaml
---
title: "Page Title"
description: "Brief summary"
date: "2025-01-01"
author: "Author Name"
tags: ["tag1", "tag2"]
categories: ["category"]
draft: false
order: 1
---
```

### Custom Fields

You can add any custom fields:

```yaml
---
title: "API Reference"
section: "Documentation"
icon: "book"
version: "2.0"
featured: true
customField: "any value"
---
```

## Integration with Navigation Builder

The frontmatter parser works seamlessly with the navigation builder:

```javascript
import { buildNavigation } from '@goobits/docs-engine/utils';

const files = [
  {
    path: '/docs/intro.md',
    content: `---
title: Introduction
section: Getting Started
order: 1
---
# Content...`
  }
];

const navigation = buildNavigation(files);
// Uses frontmatter.title, frontmatter.section, frontmatter.order
```

See [Navigation Builder](./navigation.md) for details.

## Error Handling

If frontmatter parsing fails, the parser gracefully falls back:

```javascript
const { frontmatter, content } = parseFrontmatter(`---
invalid: yaml: syntax
---
Content`);

// frontmatter = {} (empty object)
// content = original markdown (including malformed frontmatter)
// Error logged to console
```

---

## Related Documentation

**Prerequisites:** Basic YAML knowledge, markdown familiarity

**Next Steps:**
- [Navigation Builder](./navigation.md) - Auto-generate navigation from frontmatter
- [Table of Contents](./toc.md) - Generate TOC from headings

**Related:**
- [Getting Started](../getting-started.md) - Quick start guide
