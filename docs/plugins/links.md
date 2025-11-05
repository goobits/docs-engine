---
title: Links Plugin
description: Convert relative markdown links to absolute paths for SvelteKit routing
section: Plugins
difficulty: beginner
tags: [plugin, markdown, links, routing]
---

# Links Plugin

Converts relative markdown links to absolute paths while preserving anchor links and external URLs.

## What It Does

The plugin normalizes markdown links to work correctly in SvelteKit by converting relative file paths to absolute paths, removing `.md` extensions, and preserving anchor links and external URLs.

**Transformations:**
- `./file.md` → `/file`
- `../other.md` → `/other`
- `../../docs/file.md` → `/docs/file`
- `#anchor` → `#anchor` (unchanged)
- `https://external.com` → `https://external.com` (unchanged)

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

## Usage

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

## Example

```markdown
<!-- Input -->
[Next Page](./next.md)
[Previous](../prev.md)
[Jump to Section](#section)
[GitHub](https://github.com)
[Nested Doc](../../guides/advanced/config.md)

<!-- Output -->
[Next Page](/next)
[Previous](/prev)
[Jump to Section](#section)
[GitHub](https://github.com)
[Nested Doc](/guides/advanced/config)
```

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

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Table of Contents](./toc.md) - Auto-generate TOC
- [Symbol References](./symbol-references.md) - Link to TypeScript symbols

**Related:**
- [Plugin Order Guide](../guides/plugin-order.md) - Understanding plugin execution order
- [Frontmatter Parser](./frontmatter.md) - Parse metadata from markdown
