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

The plugin accepts {@LinksPluginOptions} to customize link transformation behavior.

:::tabs
```javascript
// JavaScript configuration
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

```typescript
// TypeScript configuration
import { mdsvex } from 'mdsvex';
import { linksPlugin } from '@goobits/docs-engine/plugins';
import type { PreprocessorGroup } from 'svelte/types/compiler/preprocess';

const config: { preprocess: PreprocessorGroup[] } = {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        linksPlugin(),
        // ... other plugins
      ],
    }),
  ],
};

export default config;
```
:::

## Examples

### Basic Transformations

```markdown
<!-- Input -->
[Next Page](./next.md)
[Previous](../prev.md)
[Jump to Section](#section)
[GitHub](https://github.com)
[Nested Doc](../../guides/advanced/config.md)

<!-- Output -->
[Next Page](/docs/next)
[Previous](/docs/prev)
[Jump to Section](#section)
[GitHub](https://github.com)
[Nested Doc](/docs/guides/advanced/config)
```

### Same Directory Links

```markdown
<!-- Input -->
[Configuration](./config.md)
[Setup](setup.md)
[Features](./features.md#advanced)

<!-- Output -->
[Configuration](/docs/config)
[Setup](/docs/setup)
[Features](/docs/features#advanced)
```

### Parent Directory Links

```markdown
<!-- Input from /docs/guides/advanced/index.md -->
[Back to Guides](../index.md)
[API Reference](../../api/reference.md)
[Root README](../../../README.md)

<!-- Output -->
[Back to Guides](/docs/guides/index)
[API Reference](/docs/api/reference)
[Root README](/README)
```

### Top-Level Files

Special handling for repository root files:

```markdown
<!-- Input -->
[README](../README.md)
[Contributing](../../CONTRIBUTING.md)
[License](../../../LICENSE.md)
[Security Policy](../SECURITY.md)

<!-- Output -->
[README](/README)
[Contributing](/CONTRIBUTING)
[License](/LICENSE)
[Security Policy](/SECURITY)
```

### Anchor Links Preserved

```markdown
<!-- Input -->
[Installation](#installation)
[Features](./features.md#overview)
[API](../api.md#methods)

<!-- Output -->
[Installation](#installation)
[Features](/docs/features#overview)
[API](/docs/api#methods)
```

### External Links Unchanged

```markdown
<!-- Input -->
[GitHub](https://github.com/user/repo)
[NPM](https://npmjs.com/package/name)
[Email](mailto:support@example.com)
[FTP](ftp://files.example.com)

<!-- Output - unchanged -->
[GitHub](https://github.com/user/repo)
[NPM](https://npmjs.com/package/name)
[Email](mailto:support@example.com)
[FTP](ftp://files.example.com)
```

---

## Configuration

The plugin accepts {@LinksPluginOptions} to customize which files are treated as top-level repository files.

### Custom Top-Level Files

By default, these files are kept at root level (not prefixed with `/docs/`):
- README
- LICENSE
- CONTRIBUTING
- CHANGELOG
- CODE_OF_CONDUCT
- SECURITY
- CLAUDE

**Customize the list:**

```javascript
linksPlugin({
  topLevelFiles: [
    'README',
    'LICENSE',
    'CONTRIBUTING',
    'AUTHORS',      // Add custom file
    'DONORS',       // Add custom file
  ]
})
```

### Example: Monorepo Setup

For monorepos with multiple packages:

```javascript
linksPlugin({
  topLevelFiles: [
    'README',
    'LICENSE',
    'WORKSPACE',    // Root workspace file
    'PACKAGES',     // Package index
  ]
})
```

---

## Common Use Cases

### Documentation Site

Standard documentation with guides and API references:

```markdown
<!-- In /docs/getting-started.md -->
[Next: Configuration](./configuration.md)
[API Reference](../api/index.md)
[Project README](../README.md)

<!-- Becomes -->
[Next: Configuration](/docs/configuration)
[API Reference](/docs/api/index)
[Project README](/README)
```

### Multi-Section Docs

Complex documentation with multiple sections:

```markdown
<!-- In /docs/guides/advanced/custom-plugins.md -->
[Basic Guides](../basic/intro.md)
[Plugin API](../../api/plugins.md)
[Examples](../../examples/index.md)

<!-- Becomes -->
[Basic Guides](/docs/guides/basic/intro)
[Plugin API](/docs/api/plugins)
[Examples](/docs/examples/index)
```

### Cross-Referencing

Link between related documentation:

```markdown
<!-- In plugin documentation -->
See also:
- [Plugin Order](../guides/plugin-order.md)
- [Configuration Guide](../guides/configuration.md#plugins)
- [API Reference](../api/plugins.md#linksPlugin)

<!-- Becomes -->
See also:
- [Plugin Order](/docs/guides/plugin-order)
- [Configuration Guide](/docs/guides/configuration#plugins)
- [API Reference](/docs/api/plugins#linksPlugin)
```

---

## Integration

Works seamlessly with other plugins:

```javascript
import {
  linksPlugin,
  referencePlugin,
  tocPlugin,
  calloutsPlugin,
} from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        // Structural plugins first
        calloutsPlugin(),

        // Links BEFORE references (critical!)
        linksPlugin(),

        // References after links
        referencePlugin(),

        // TOC can go anywhere
        tocPlugin(),
      ],
    }),
  ],
};
```

> **Important:** Run `linksPlugin()` before `referencePlugin()` to ensure markdown links are processed before symbol references.

---

## Troubleshooting

:::collapse{title="Links not transforming correctly?"}

**Common issues:**

1. **Plugin order** - Links plugin must run early in the pipeline
2. **Already absolute** - Links starting with `/` are skipped
3. **External links** - URLs with protocols (`https://`, `mailto:`) are preserved
4. **Missing .md extension** - Plugin handles both `file.md` and `file` syntax

**Debug tips:**

```javascript
// Log transformed links for debugging
linksPlugin({
  topLevelFiles: ['README', 'LICENSE'],
  // Add console.log in plugin to see transformations
})
```

:::

:::collapse{title="Top-level files showing /docs/ prefix?"}

**Cause:** File not in `topLevelFiles` array.

**Fix:** Add the file to the configuration:

```javascript
linksPlugin({
  topLevelFiles: [
    'README',
    'LICENSE',
    'MYFILE',  // Add your file (without .md extension)
  ]
})
```

**Note:** File names are case-insensitive (`readme` === `README`).

:::

:::collapse{title="Anchor links breaking?"}

**Symptoms:** Links like `[Section](#heading)` not working.

**Cause:** Anchor-only links (starting with `#`) are preserved unchanged.

**Check:**
- Make sure heading IDs match (check with browser inspector)
- Use lowercase, hyphenated IDs: `#my-section` not `#My Section`
- Verify heading exists on target page

**Works correctly:**
```markdown
[Same page](#section)           ✅ Preserved as #section
[Other page](./page.md#section) ✅ Becomes /docs/page#section
```

:::

---

## Best Practices

1. **Use relative paths in markdown** - Write `./file.md` for same directory, `../file.md` for parent
2. **Include .md extensions** - Helps with GitHub preview: `[Link](./page.md)` not `[Link](./page)`
3. **Run links plugin early** - Before symbol references and other content transformations
4. **Test locally** - Preview transformed links in development mode
5. **Preserve fragments** - Always include anchor links: `./page.md#section`
6. **Document cross-references** - Use consistent link patterns across documentation

**Recommended link patterns:**

```markdown
<!-- ✅ Good - Explicit and works on GitHub -->
[Configuration Guide](../guides/configuration.md)
[API Reference](../../api/reference.md#method)
[README](../../README.md)

<!-- ❌ Avoid - Unclear and may not work on GitHub -->
[Configuration Guide](/docs/guides/configuration)
[API Reference](api/reference)
```

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Table of Contents](./toc.md) - Auto-generate TOC
- [Symbol References](./symbol-references.md) - Link to TypeScript symbols

**Related:**
- [Plugin Order Guide](../guides/plugin-order.md) - Understanding plugin execution order
- [Frontmatter Parser](../utilities/frontmatter.md) - Parse metadata from markdown
