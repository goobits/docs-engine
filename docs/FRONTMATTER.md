# Frontmatter Parser

Parse YAML frontmatter from markdown files to extract metadata.

## Installation

The frontmatter utilities are included in `@goobits/docs-engine/utils`.

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

### `parseFrontmatter(markdown: string): ParsedContent`

Extracts and parses YAML frontmatter from markdown.

**Returns:**
```typescript
interface ParsedContent {
  frontmatter: Frontmatter;  // Parsed YAML object
  content: string;            // Markdown without frontmatter
  raw: string;                // Original markdown
}
```

**Frontmatter format:**
```typescript
interface Frontmatter {
  title?: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  draft?: boolean;
  order?: number;
  [key: string]: any;  // Custom fields allowed
}
```

### `extractTitle(frontmatter, content, fallback): string`

Extracts a title using priority order:

1. `frontmatter.title` (if present)
2. First `# Heading` in content
3. Fallback string

**Example:**

```javascript
// Has frontmatter title
extractTitle({ title: 'Custom' }, '# Heading', 'Fallback');
// → "Custom"

// No frontmatter, uses heading
extractTitle({}, '# My Page\n\nContent...', 'Fallback');
// → "My Page"

// No title found
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

See [NAVIGATION.md](../NAVIGATION.md) for details.

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
