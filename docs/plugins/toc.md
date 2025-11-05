---
title: Table of Contents Plugin
description: Auto-generate a table of contents from markdown headings
section: Plugins
difficulty: beginner
tags: [plugin, markdown, toc, navigation]
---

# Table of Contents Plugin

Auto-generate a table of contents from markdown headings.

## Usage

### Add to MDSveX Config

```javascript
import { tocPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        tocPlugin(),
        // ... other plugins
      ],
    }),
  ],
};
```

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

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Links Plugin](./links.md) - Convert relative links to absolute paths
- [Frontmatter Parser](./frontmatter.md) - Parse metadata from markdown

**Related:**
- [Navigation Builder](./navigation.md) - Auto-generate navigation from files
