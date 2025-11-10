---
title: Table of Contents Plugin
description: Auto-generate a table of contents from markdown headings
section: Plugins
difficulty: beginner
tags: [plugin, markdown, toc, navigation]
---

# Table of Contents Plugin

Auto-generate a table of contents from markdown headings.

## TOC:3

## Usage

### Add to MDSveX Config

:::tabs
```javascript
// JavaScript
import { remarkTableOfContents } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        remarkTableOfContents(),
        // ... other plugins
      ],
    }),
  ],
};
```

```typescript
// TypeScript
import { mdsvex } from 'mdsvex';
import { remarkTableOfContents } from '@goobits/docs-engine/plugins';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        remarkTableOfContents(),
        // ... other plugins
      ],
    }),
  ],
};

export default config;
```
:::

### Use in Markdown

```markdown
# My Document

## TOC

## Introduction
Content here...

## Getting Started
More content...

### Step 1
Subsection...
```

This generates:

```markdown
## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Step 1](#step-1)
```

## Control Depth

Specify how many heading levels to include:

```markdown
## TOC:2    <!-- Only H2 headings -->
## TOC:3    <!-- H2 and H3 headings -->
## TOC:4    <!-- H2, H3, and H4 headings -->
## TOC      <!-- Default: depth 2 -->
## TOC:0    <!-- All levels (same as TOC:6) -->
```

## Features

- **Auto-generates IDs** - Headings automatically get kebab-case IDs
- **Clickable links** - TOC items link to their sections
- **Nested structure** - Respects heading hierarchy
- **Customizable depth** - Control how deep the TOC goes
- **One TOC per document** - Only the first `## TOC` marker is processed

## Example

**Input:**

```markdown
# API Reference

## TOC:3

## Authentication
How to authenticate...

### API Keys
Using API keys...

### OAuth
Using OAuth...

## Endpoints
Available endpoints...

### GET /users
Fetch users...

#### Query Parameters
Filter parameters...
```

**Output:**

A rendered table of contents with links to:
- Authentication
  - API Keys
  - OAuth
- Endpoints
  - GET /users
    - Query Parameters

---

## Advanced Examples

### Complex Document Structure

```markdown
# User Guide

## TOC:4

## Getting Started
Introduction to the system...

### Prerequisites
What you need...

#### Node.js Version
Minimum version required...

### Installation
How to install...

#### NPM Installation
Using npm...

#### Yarn Installation
Using yarn...

## Configuration
Setting up the config...

### Basic Setup
Simple configuration...

### Advanced Setup
Complex configuration...

#### Environment Variables
Setting env vars...

#### Custom Plugins
Adding plugins...
```

**Generated TOC:**
- Getting Started
  - Prerequisites
    - Node.js Version
  - Installation
    - NPM Installation
    - Yarn Installation
- Configuration
  - Basic Setup
  - Advanced Setup
    - Environment Variables
    - Custom Plugins

### Multiple TOC Markers

```markdown
## TOC

## Section 1
Content...

## TOC    <!-- ⚠️ Ignored - only first TOC is processed -->

## Section 2
Content...
```

> **Note:** Only the first `## TOC` marker in the document is processed. Additional markers are ignored.

### TOC with Mixed Heading Levels

```markdown
## TOC:3

## Overview

### Introduction

## Installation

#### Advanced Options    <!-- Skipped - H4 but missing parent H3 -->

### Basic Install

#### Step 1              <!-- Included - proper nesting -->
```

**Result:** TOC maintains proper hierarchy, skipping orphaned headings.

---

## Common Use Cases

### Long Documentation Pages

For comprehensive guides with many sections:

```markdown
# Complete API Documentation

## TOC:3

<!-- 50+ sections with subsections -->
```

Benefits:
- Quick navigation to specific sections
- Visual outline of document structure
- Better UX for long-form content

### Tutorial Series

For step-by-step tutorials:

```markdown
# Building Your First App

## TOC:2

## Part 1: Setup
## Part 2: Creating Components
## Part 3: Adding State
## Part 4: Deployment
```

### API Reference Pages

For technical documentation:

```markdown
# API Methods

## TOC:4

## Authentication Methods
### login()
#### Parameters
#### Returns

### logout()
#### Parameters
#### Returns
```

---

## Best Practices

1. **Place TOC early** - Put `## TOC` near the top of your document, after the main title
2. **Use appropriate depth** - `TOC:2` for overviews, `TOC:3` or `TOC:4` for detailed docs
3. **Consistent heading levels** - Don't skip levels (H2 → H4 without H3)
4. **Descriptive headings** - Make headings clear since they appear in TOC
5. **Avoid too many levels** - `TOC:4` is usually the maximum useful depth
6. **One TOC per page** - Multiple TOCs can be confusing

**Good heading structure:**

```markdown
## TOC:3

## Introduction          <!-- H2 -->
### Why Use This         <!-- H3 under H2 -->
### When to Use          <!-- H3 under H2 -->

## Getting Started       <!-- H2 -->
### Installation         <!-- H3 under H2 -->
#### Via NPM            <!-- H4 under H3 -->
```

**Avoid:**

```markdown
## TOC

## Section
#### Subsection         <!-- ❌ Skipped H3 level -->

## Another Section
### Subsection
##### Details          <!-- ❌ Skipped H4 level -->
```

---

## Integration with Other Plugins

### With Links Plugin

```javascript
import {
  linksPlugin,
  remarkTableOfContents,
} from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        linksPlugin(),           // Process links first
        remarkTableOfContents(), // Then generate TOC
      ],
    }),
  ],
};
```

### Full Plugin Stack

```javascript
import {
  calloutsPlugin,
  linksPlugin,
  remarkTableOfContents,
  codeHighlightPlugin,
} from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        // Structural plugins first
        calloutsPlugin(),
        linksPlugin(),

        // TOC generation
        remarkTableOfContents(),

        // Code highlighting last
        codeHighlightPlugin(),
      ],
    }),
  ],
};
```

---

## Troubleshooting

:::collapse{title="TOC not generating?"}

**Common causes:**

1. **Missing TOC marker** - Add `## TOC` to your markdown
2. **Wrong heading level** - Use `## TOC` (H2), not `# TOC` (H1) or `### TOC` (H3)
3. **No headings to index** - Document must have H2+ headings after the TOC marker
4. **Plugin not added** - Check that `remarkTableOfContents()` is in your config

**Check your setup:**

```javascript
// ✅ Correct
remarkPlugins: [
  remarkTableOfContents(),
]

// ❌ Missing plugin
remarkPlugins: [
  linksPlugin(),
  // remarkTableOfContents() missing!
]
```

:::

:::collapse{title="TOC is empty or incomplete?"}

**Possible issues:**

1. **TOC depth too shallow** - Try `## TOC:3` or `## TOC:4` for more levels
2. **Headings after TOC** - Only headings that come after `## TOC` are indexed
3. **Skipped heading levels** - Jumping from H2 to H4 skips H3 content
4. **Special characters in headings** - Some characters may affect ID generation

**Example fix:**

```markdown
<!-- ❌ Problem -->
## TOC:2

### Subsection        <!-- Skipped - starts at H3 -->

<!-- ✅ Solution -->
## TOC:2

## Section           <!-- Starts at H2 -->
### Subsection       <!-- Now included -->
```

:::

:::collapse{title="TOC links not working?"}

**Symptoms:** Clicking TOC items doesn't jump to sections.

**Causes:**

1. **Missing IDs** - The plugin should auto-generate IDs, but check rendered HTML
2. **Duplicate headings** - Multiple headings with same text may cause conflicts
3. **Special characters** - Headings with special chars may have unpredictable IDs
4. **Manual ID conflicts** - Custom IDs may override auto-generated ones

**Debug:**

Inspect the rendered HTML:

```html
<!-- Should look like this -->
<h2 id="getting-started">Getting Started</h2>
<a href="#getting-started">Getting Started</a>
```

**Fix duplicate headings:**

```markdown
<!-- ❌ Ambiguous -->
## Overview
### Overview        <!-- Same name - confusing IDs -->

<!-- ✅ Clear -->
## Overview
### Installation Overview    <!-- Unique name -->
```

:::

:::collapse{title="TOC showing unwanted headings?"}

**Cause:** Depth setting too high.

**Solution:** Reduce depth level:

```markdown
<!-- Shows H2, H3, H4, H5 -->
## TOC:5

<!-- Shows only H2, H3 -->
## TOC:3
```

**Or exclude sections:** There's no built-in way to exclude specific headings. Consider:
1. Adjust depth to exclude lower levels
2. Restructure document to change heading levels
3. Use custom CSS to hide unwanted TOC items

:::

:::collapse{title="Multiple TOCs appearing?"}

**Cause:** Multiple `## TOC` markers in the document.

**Behavior:** Only the first TOC marker is processed; others are left as regular headings.

**Solution:**

```markdown
<!-- ✅ Good - One TOC -->
## TOC

## Section 1
## Section 2

<!-- ❌ Confusing - Extra TOC marker -->
## TOC
## Section 1
## TOC    <!-- This appears as a regular heading -->
```

**Remove or rename extra TOC markers.**

:::

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Links Plugin](./links.md) - Convert relative links to absolute paths
- [Frontmatter Parser](../utilities/frontmatter.md) - Parse metadata from markdown

**Related:**
- [Navigation Builder](./navigation.md) - Auto-generate navigation from files
