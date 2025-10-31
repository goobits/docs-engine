# Links Plugin

Converts top-level file links (e.g., `./file.md`, `../other.md`) to absolute paths while preserving anchor links and external URLs.

## Installation

The links plugin is included in `@goobits/docs-engine/plugins`.

## Usage

### Add to MDSveX Config

```javascript
import { linksPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        linksPlugin(),
        // ... other plugins
      ],
    }),
  ],
};
```

## What It Does

The plugin normalizes markdown links to work correctly in SvelteKit:

### Before

```markdown
[Getting Started](./getting-started.md)
[API Reference](../api/reference.md)
[Overview](#overview)
[External](https://example.com)
```

### After

```markdown
[Getting Started](/getting-started)
[API Reference](/api/reference)
[Overview](#overview)
[External](https://example.com)
```

## Features

- ✅ **Converts relative file paths** to absolute paths
- ✅ **Preserves anchor links** (`#section`)
- ✅ **Preserves external URLs** (http://, https://)
- ✅ **Removes `.md` extensions** for cleaner URLs
- ✅ **Handles nested paths** (`../../docs/file.md` → `/docs/file`)

## Examples

### Relative Links

```markdown
<!-- Input -->
[Next Page](./next.md)
[Previous](../prev.md)

<!-- Output -->
[Next Page](/next)
[Previous](/prev)
```

### Anchor Links

```markdown
<!-- Input -->
[Jump to Section](#section)

<!-- Output (unchanged) -->
[Jump to Section](#section)
```

### External URLs

```markdown
<!-- Input -->
[GitHub](https://github.com)
[Docs](http://docs.example.com)

<!-- Output (unchanged) -->
[GitHub](https://github.com)
[Docs](http://docs.example.com)
```

### Complex Paths

```markdown
<!-- Input -->
[Nested Doc](../../guides/advanced/config.md)

<!-- Output -->
[Nested Doc](/guides/advanced/config)
```

## Why Use This?

In SvelteKit, links to markdown files need to be converted to route paths:

- **Markdown files**: `./getting-started.md`
- **SvelteKit routes**: `/getting-started`

This plugin automates the conversion, allowing you to write natural markdown links that work correctly when rendered.

## Integration

Works seamlessly with other plugins:

```javascript
import {
  linksPlugin,
  tocPlugin,
  calloutsPlugin,
} from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        linksPlugin(),      // Convert links first
        tocPlugin(),        // Then generate TOC
        calloutsPlugin(),   // Then process callouts
      ],
    }),
  ],
};
```
