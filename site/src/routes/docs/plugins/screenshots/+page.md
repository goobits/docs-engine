---
title: Screenshots Plugin
description: Automated screenshot generation for documentation with version-based caching
section: Plugins
difficulty: intermediate
tags: [plugin, screenshots, playwright, cli]
---

# Screenshots Plugin

Automated screenshot generation for documentation with version-based caching and multiple output formats.

## Features

- Web screenshots - Capture any URL with Playwright
- CLI screenshots - Execute commands and render terminal output
- Syntax highlighting - Terminal output with theme support
- Multiple formats - PNG, WebP, and retina (@2x) versions
- Version caching - Screenshots organized by version number
- Simple markdown syntax - Easy code block syntax
- Lazy generation - Only creates screenshots when requested

## Minimal Config

```bash
pnpm add @goobits/docs-engine playwright
pnpm exec playwright install chromium
```

```javascript
// svelte.config.js
import { screenshotPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [screenshotPlugin()],
    }),
  ],
};
```

````markdown
```screenshot:homepage
https://example.com
```
````

## Basic Config

The plugin accepts {@ScreenshotPluginOptions} to configure screenshot generation behavior.

### Add Plugin

```javascript
screenshotPlugin({
  basePath: '/screenshots',
  version: '1.0.0'
})
```

### Create API Endpoint

```javascript
// src/routes/api/screenshots/+server.ts
import { createScreenshotEndpoint } from '@goobits/docs-engine/server';

export const POST = createScreenshotEndpoint({
  screenshots: {
    basePath: '/screenshots',
    version: '1.0.0',
    cli: {
      allowedCommands: ['npm', 'git', 'ls', 'cat'],
      timeout: 30000,
      maxOutputLength: 10000
    }
  }
});
```

### Add Hydrator

```svelte
<script>
  import { ScreenshotHydrator } from '@goobits/docs-engine/components';
</script>

<ScreenshotHydrator />
<slot />
```

## Advanced Config

### Web Screenshot with Options

````markdown
```screenshot:dashboard
url: http://localhost:3000/dashboard
viewport: 1280x720
selector: .main-content
fullPage: true
waitFor: .loaded
```
````

### CLI Screenshot

````markdown
```screenshot:git-status
type: cli
command: git status
theme: dracula
viewport: 800x400
showPrompt: true
promptText: $
```
````

---

## Real Examples

Here are practical CLI screenshot examples showcasing common documentation scenarios:

### Git Commands

````markdown
```screenshot:git-status-example
type: cli
command: git status
theme: dracula
showPrompt: true
```
````

````markdown
```screenshot:git-log-example
type: cli
command: git log --oneline -5
theme: monokai
showPrompt: true
```
````

### Package Manager Commands

````markdown
```screenshot:npm-install
type: cli
command: npm install @goobits/docs-engine
theme: nord
showPrompt: true
promptText: $
```
````

````markdown
```screenshot:pnpm-build
type: cli
command: pnpm run build
theme: dracula
viewport: 900x500
```
````

### File System Operations

````markdown
```screenshot:ls-tree
type: cli
command: ls -la src/lib/plugins/
theme: solarized
showPrompt: true
```
````

````markdown
```screenshot:cat-config
type: cli
command: cat package.json
theme: dracula
viewport: 800x600
```
````

### Testing Commands

````markdown
```screenshot:vitest-run
type: cli
command: vitest run --reporter=verbose
theme: nord
viewport: 1000x600
```
````

### TypeScript Commands

````markdown
```screenshot:tsc-check
type: cli
command: tsc --noEmit
theme: monokai
showPrompt: true
```
````

````markdown
```screenshot:tsx-script
type: cli
command: tsx scripts/generate-symbols.ts
theme: dracula
showPrompt: true
```
````

### Docker Commands

````markdown
```screenshot:docker-ps
type: cli
command: docker ps
theme: nord
showPrompt: true
promptText: docker>
```
````

---

## Configuration Options

### Web Screenshot Options

- `url` (string, required) - URL to screenshot
- `viewport` (string) - Viewport size (e.g., `1280x720`)
- `selector` (string) - CSS selector to screenshot (instead of full page)
- `fullPage` (boolean) - Capture full scrollable page
- `waitFor` (string) - CSS selector to wait for before screenshot

### CLI Screenshot Options

- `type` (string, required) - Must be `cli`
- `command` (string, required) - Command to execute
- `theme` (string) - Terminal theme: `dracula`, `monokai`, `solarized`, `nord`
- `viewport` (string) - Terminal size (e.g., `800x400`)
- `showPrompt` (boolean, default: `true`) - Show command prompt
- `promptText` (string, default: `$`) - Prompt text

---

## Security

### Command Whitelisting

CLI screenshots **require** command whitelisting for security:

```javascript
cli: {
  allowedCommands: ['npm', 'git', 'ls']
}
```

Only commands starting with whitelisted strings are allowed:
- ✓ `npm run build` (allowed if `npm` whitelisted)
- ✓ `git status` (allowed if `git` whitelisted)
- ✗ `rm -rf /` (blocked - `rm` not whitelisted)

### Timeouts

All commands have timeouts to prevent hanging:

```javascript
cli: {
  timeout: 30000  // 30 seconds max
}
```

### Output Limits

Output is truncated to prevent memory issues:

```javascript
cli: {
  maxOutputLength: 10000  // 10KB max
}
```

---

## Version Management

Screenshots are organized by version for cache busting:

```
static/
  screenshots/
    v1.0.0/
      homepage.png
      homepage@2x.png
      homepage.webp
      homepage@2x.webp
    v1.1.0/
      homepage.png
      ...
```

When you update your version number:
- New screenshots go to new version folder
- Old screenshots remain cached
- Users get fresh screenshots automatically

---

## Troubleshooting

**Screenshots not generating?** Check Playwright is installed (`pnpm exec playwright install chromium`), verify endpoint is configured at `/api/screenshots/+server.ts`, and check browser console.

**CLI command blocked?** Add command to whitelist: `cli: { allowedCommands: ['your-command'] }`

**Screenshot is stale?** Bump the version number to force regeneration.

---

## Best Practices

1. **Use semantic versioning** - Bump version when screenshots should regenerate
2. **Whitelist sparingly** - Only allow safe, necessary commands
3. **Set reasonable viewports** - Smaller = faster generation and smaller files
4. **Use selectors for large pages** - Screenshot specific areas instead of full page
5. **Test locally first** - Generate screenshots in dev before deploying

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge, Playwright understanding

**Next Steps:**
- [Image Optimization](./image-optimization.md) - Optimize static images

**Related:**
- [Getting Started](../getting-started.md) - Quick start guide
