# Table of Contents Plugin

Auto-generate a table of contents from markdown headings.

## Installation

The TOC plugin is included in `@goobits/docs-engine/plugins`.

## Usage

### 1. Add to MDSveX Config

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

### 2. Use in Markdown

Add a `## TOC` heading where you want the table of contents to appear:

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

This will generate:

```markdown
## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Step 1](#step-1)
```

## Options

### Control Depth

Specify how many heading levels to include:

```markdown
## TOC:2    <!-- Only H2 headings -->
## TOC:3    <!-- H2 and H3 headings -->
## TOC:4    <!-- H2, H3, and H4 headings -->
## TOC      <!-- Default: depth 2 -->
## TOC:0    <!-- All levels (same as TOC:6) -->
```

## Features

- **Auto-generates IDs**: Headings automatically get kebab-case IDs
- **Clickable links**: TOC items link to their sections
- **Nested structure**: Respects heading hierarchy
- **Customizable depth**: Control how deep the TOC goes
- **One TOC per document**: Only the first `## TOC` marker is processed

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
