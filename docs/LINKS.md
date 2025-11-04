# Links Plugin

Converts top-level file links (e.g., `./file.md`, `../other.md`) to absolute paths while preserving anchor links and external URLs.

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

## What It Does

Converts relative file paths to absolute paths, preserves anchor links and external URLs, removes `.md` extensions, and handles nested paths (`../../docs/file.md` → `/docs/file`).

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
