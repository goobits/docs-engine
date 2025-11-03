# Screenshots

Automated screenshot generation for documentation with version-based caching and multiple output formats.

## Features

- 📸 **Web screenshots** - Capture any URL with Playwright
- 🖥️ **CLI screenshots** - Execute commands and render terminal output
- 🎨 **Syntax highlighting** - Terminal output with theme support
- 📦 **Multiple formats** - PNG, WebP, and retina (@2x) versions
- 🔄 **Version caching** - Screenshots organized by version number
- ✨ **Simple markdown syntax** - Easy code block syntax
- ⚡ **Lazy generation** - Only creates screenshots when requested

## Quick Start

### 1. Install Dependencies

```bash
pnpm add @goobits/docs-engine playwright
pnpm exec playwright install chromium
```

### 2. Add Screenshot Plugin

```javascript
// svelte.config.js
import { mdsvex } from 'mdsvex';
import { screenshotPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        screenshotPlugin({
          basePath: '/screenshots',  // Optional (default)
          version: '1.0.0'            // Optional (default)
        }),
      ],
    }),
  ],
};
```

### 3. Create Screenshot API Endpoint

```javascript
// src/routes/api/screenshots/+server.ts
import { createScreenshotEndpoint } from '@goobits/docs-engine/server';

export const POST = createScreenshotEndpoint({
  screenshots: {
    basePath: '/screenshots',
    version: '1.0.0',
    cli: {
      allowedCommands: ['npm', 'git', 'ls', 'cat'],  // Whitelist commands
      timeout: 30000,
      maxOutputLength: 10000
    }
  }
});
```

### 4. Add Hydrator to Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { ScreenshotHydrator } from '@goobits/docs-engine/components';
</script>

<ScreenshotHydrator />
<slot />
```

### 5. Use in Markdown!

````markdown
# My Documentation

## Web Screenshot

```screenshot:homepage
https://example.com
```

## CLI Screenshot

```screenshot:build-output
type: cli
command: npm run build
theme: dracula
```
````

## Markdown Syntax

### Simple Web Screenshot

````markdown
```screenshot:dashboard
https://example.com/dashboard
```
````

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

## Configuration

### Plugin Options

```typescript
interface ScreenshotPluginOptions {
  basePath?: string;   // Default: '/screenshots'
  version?: string;    // Default: '1.0.0'
}
```

**Example:**

```javascript
screenshotPlugin({
  basePath: '/assets/screenshots',
  version: process.env.VERSION || '1.0.0'
})
```

### Web Screenshot Options

| Option | Type | Description |
|--------|------|-------------|
| `url` | string | **Required.** URL to screenshot |
| `viewport` | string | Viewport size (e.g., `1280x720`) |
| `selector` | string | CSS selector to screenshot (instead of full page) |
| `fullPage` | boolean | Capture full scrollable page |
| `waitFor` | string | CSS selector to wait for before screenshot |

### CLI Screenshot Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | Must be `cli` |
| `command` | string | **Required.** Command to execute |
| `theme` | string | Terminal theme: `dracula`, `monokai`, `solarized`, `nord` |
| `viewport` | string | Terminal size (e.g., `800x400`) |
| `showPrompt` | boolean | Show command prompt (default: true) |
| `promptText` | string | Prompt text (default: `$`) |

### Endpoint Configuration

```typescript
interface ScreenshotsConfig {
  enabled?: boolean;           // Enable screenshots (default: true)
  basePath: string;            // Public path for screenshots
  version: string;             // Version for cache busting
  cli?: {
    allowedCommands?: string[]; // Whitelist of allowed commands
    timeout?: number;           // Command timeout in ms (default: 30000)
    maxOutputLength?: number;   // Max output length (default: 10000)
  };
}
```

**Example:**

```javascript
createScreenshotEndpoint({
  screenshots: {
    basePath: '/screenshots',
    version: process.env.VERSION || '1.0.0',
    cli: {
      allowedCommands: [
        'npm', 'pnpm',          // Package managers
        'git',                  // Version control
        'ls', 'cat', 'pwd',    // Basic shell
        'spacebase'             // Custom CLI
      ],
      timeout: 60000,           // 1 minute
      maxOutputLength: 50000
    }
  }
})
```

## How It Works

### Build Time

1. Plugin finds `screenshot:name` code blocks in markdown
2. Parses configuration from block content
3. Replaces with HTML div containing metadata:
   ```html
   <div class="md-screenshot"
        data-name="homepage"
        data-url="https://example.com"
        data-path="/screenshots/v1.0.0/homepage.png"
        data-version="1.0.0"
        data-config="eyJ1cmwiOi...">
   </div>
   ```

### Runtime (Client-Side)

1. `ScreenshotHydrator` finds all `.md-screenshot` divs
2. Mounts `ScreenshotImage` component for each
3. Component checks if screenshot exists at `data-path`
4. If missing, POSTs to `/api/screenshots` to generate
5. Displays image once available

### Runtime (Server-Side - Screenshot Generation)

**Web Screenshots:**
1. Launch headless Chromium with Playwright
2. Navigate to URL with specified viewport
3. Wait for selector (if specified)
4. Capture screenshot at 2x resolution
5. Generate PNG and WebP in multiple sizes:
   - `name.png` (1x)
   - `name@2x.png` (2x retina)
   - `name.webp` (1x)
   - `name@2x.webp` (2x retina)
6. Return paths and dimensions

**CLI Screenshots:**
1. Execute command (if whitelisted)
2. Capture stdout/stderr
3. Render terminal output as HTML with syntax highlighting
4. Launch headless Chromium
5. Screenshot the rendered terminal
6. Generate multiple formats
7. Return paths and dimensions

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

## Security

### Command Whitelisting

CLI screenshots **require** command whitelisting for security:

```javascript
cli: {
  allowedCommands: ['npm', 'git', 'ls']
}
```

Only commands starting with whitelisted strings are allowed:
- ✅ `npm run build` (allowed if `npm` whitelisted)
- ✅ `git status` (allowed if `git` whitelisted)
- ❌ `rm -rf /` (blocked - `rm` not whitelisted)

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

## Examples

### Documentation Homepage

````markdown
```screenshot:docs-homepage
url: http://localhost:3000
viewport: 1440x900
fullPage: true
```
````

### Interactive Dashboard

````markdown
```screenshot:dashboard
url: http://localhost:3000/dashboard
viewport: 1280x720
waitFor: [data-loaded="true"]
selector: .dashboard-content
```
````

### Git Status Output

````markdown
```screenshot:git-status
type: cli
command: git status
theme: dracula
```
````

### Build Output

````markdown
```screenshot:build
type: cli
command: npm run build
theme: monokai
viewport: 1000x600
```
````

### Custom CLI Tool

````markdown
```screenshot:spacebase-ping
type: cli
command: spacebase ping
theme: nord
showPrompt: true
promptText: spacebase>
```
````

## Troubleshooting

### Screenshots not generating

1. Check Playwright is installed: `pnpm exec playwright install chromium`
2. Verify endpoint is configured at `/api/screenshots/+server.ts`
3. Check browser console for errors
4. Verify command is whitelisted (for CLI screenshots)

### "Playwright not installed" error

```bash
pnpm add -D playwright
pnpm exec playwright install chromium
```

### CLI command blocked

Add command to whitelist:

```javascript
cli: {
  allowedCommands: ['your-command']
}
```

### Screenshot is stale

Bump the version number to force regeneration:

```javascript
screenshotPlugin({
  version: '1.0.1'  // Was 1.0.0
})
```

## Best Practices

1. **Use semantic versioning** - Bump version when screenshots should regenerate
2. **Whitelist sparingly** - Only allow safe, necessary commands
3. **Set reasonable viewports** - Smaller = faster generation and smaller files
4. **Use selectors for large pages** - Screenshot specific areas instead of full page
5. **Test locally first** - Generate screenshots in dev before deploying
6. **Consider file size** - Screenshots in `static/` increase bundle size

## Advanced: Custom Terminal Renderer

Need custom terminal styling? Create your own renderer:

```javascript
// src/routes/api/screenshots/terminal-render/+server.ts
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  const { output, theme } = await request.json();

  // Your custom HTML generation
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>/* Your styles */</style>
      </head>
      <body>
        <pre>${escapeHtml(output)}</pre>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
};
```

Then the screenshot service will use your custom renderer!
