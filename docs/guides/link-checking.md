---
title: Link Checking
description: Automated link validation in your documentation
---

# Link Checking

The link checker validates internal and external links in your markdown documentation to catch broken links before deployment.

## Overview

The link checker:

- **Validates internal links** - Checks that referenced files and anchors exist
- **Validates external links** - Optionally checks HTTP/HTTPS URLs (disabled by default)
- **Fails builds** - Exits with error code 1 when broken links are found
- **Provides detailed reports** - Shows file, line number, and error for each broken link
- **Fast by default** - Only checks internal links for quick feedback
- **Configurable** - Customize what to check and what to ignore

## Quick Start

### Run Link Checker Manually

```bash
# Check links in documentation
pnpm check-links

# Skip link checking (emergency bypass)
BUILD_SKIP_LINK_CHECK=1 pnpm check-links
```

### Integration with Build Process

The link checker is automatically integrated into the build process via `prebuild` script:

```bash
# Build will run link checker first
pnpm build

# Skip link checking during build
BUILD_SKIP_LINK_CHECK=1 pnpm build
```

When broken links are found, the build will fail with a detailed report showing:
- File path and line number
- The broken link URL
- Error message explaining the issue

## Configuration

### Configuration File

Create `.linkcheckerrc.json` in your project root:

```json
{
  "baseDir": "docs",
  "include": ["**/*.md", "**/*.mdx"],
  "exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/versioned_docs/**",
    "**/.generated/**"
  ],
  "checkExternal": false,
  "timeout": 5000,
  "concurrency": 10,
  "skipDomains": ["localhost", "127.0.0.1", "example.com"],
  "validExtensions": [".md", ".mdx"]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseDir` | `string` | `"docs"` | Base directory containing markdown files |
| `include` | `string[]` | `["**/*.md", "**/*.mdx"]` | Glob patterns to include |
| `exclude` | `string[]` | See below | Glob patterns to exclude |
| `checkExternal` | `boolean` | `false` | Validate external HTTP/HTTPS links |
| `timeout` | `number` | `5000` | Timeout for external requests (ms) |
| `concurrency` | `number` | `10` | Max concurrent external requests |
| `skipDomains` | `string[]` | `["localhost", "127.0.0.1", "example.com"]` | Domains to skip validation |
| `validExtensions` | `string[]` | `[".md", ".mdx"]` | Valid file extensions |

**Default excludes:**
```json
[
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/versioned_docs/**",
  "**/.generated/**"
]
```

### External Link Checking

By default, external links are **not checked** for performance reasons. To enable:

```json
{
  "checkExternal": true,
  "timeout": 5000,
  "concurrency": 10
}
```

:::warning[Performance Impact]
Checking external links can significantly slow down builds, especially with many external references. Consider:
- Using external link checking only in CI/CD
- Running it as a separate scheduled job
- Increasing timeout for slow domains
:::

## Usage Examples

### Basic Usage

```bash
# Check links with default config
pnpm check-links

# Use custom config file
pnpm check-links --config ./custom-link-config.json
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Link Checker

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Check links
        run: pnpm check-links

      # Optional: Check external links separately
      - name: Check external links (weekly)
        if: github.event.schedule == '0 0 * * 0'
        run: |
          echo '{"checkExternal": true}' > .linkcheckerrc.json
          pnpm check-links
```

#### GitLab CI

```yaml
check-links:
  stage: test
  script:
    - pnpm install
    - pnpm check-links
  only:
    - merge_requests
    - main
```

### Emergency Bypass

If you need to deploy urgently with broken links:

```bash
# Skip link checking
BUILD_SKIP_LINK_CHECK=1 pnpm build

# In CI/CD, set environment variable
export BUILD_SKIP_LINK_CHECK=1
pnpm build
```

:::danger[Use Sparingly]
Bypassing link checking should be a last resort. Broken links hurt user experience and SEO. Fix the links as soon as possible.
:::

## Link Validation Rules

### Internal Links

The link checker validates:

1. **Relative links** - `./page.md`, `../guide.md`
2. **Absolute links** - `/docs/getting-started`
3. **Anchor links** - `#section`, `./page.md#section`
4. **Extension handling** - Automatically adds `.md` if missing
5. **Index files** - Treats directories as `index.md`

### Supported Link Formats

```markdown
<!-- Markdown links -->
[Text](./relative-link.md)
[Text](/absolute-link)
[Text](./page.md#anchor)

<!-- Images -->
![Alt text](./image.png)

<!-- HTML links -->
<a href="./page.md">Link</a>
```

### Common Issues

#### Issue: "File not found"

```
❌ /docs/index.md:127
   Link: ./plugins/navigation.md
   Error: File not found: /docs/plugins/navigation.md
```

**Solutions:**
- Check if file exists at the specified path
- Verify file extension (`.md` vs `.mdx`)
- Check for typos in filename
- Ensure file is not in excluded patterns

#### Issue: "Anchor not found"

```
❌ /docs/guide.md:42
   Link: ./page.md#section
   Error: Anchor #section not found in /docs/page.md
```

**Solutions:**
- Verify heading exists in target file
- Check anchor slug (spaces become `-`, special chars removed)
- Use lowercase anchors
- Verify HTML anchor `<a id="section">` exists

#### Issue: External link timeout

```
⚠️ /docs/resources.md:15
   Link: https://example.com/api
   Error: Request timed out after 5000ms
```

**Solutions:**
- Increase timeout in config
- Check if domain is reachable
- Add to `skipDomains` if domain is unreliable
- Consider disabling external link checking

## Performance

### Benchmarks

Typical performance on a documentation site with:
- 50 markdown files
- 500 internal links
- 100 external links (when enabled)

| Configuration | Time |
|---------------|------|
| Internal links only | 1-2 seconds |
| Internal + external | 10-20 seconds |
| Internal + external (cached) | 3-5 seconds |

### Optimization Tips

1. **Disable external checking** - Only check internal links locally
2. **Use exclude patterns** - Skip generated or vendored docs
3. **Separate external checks** - Run as scheduled job in CI
4. **Increase concurrency** - For many external links
5. **Cache results** - External links are cached within script execution

## Best Practices

### Development Workflow

1. **Write docs with link checker in mind**
   - Use relative links where possible
   - Keep consistent file structure
   - Test links as you write

2. **Pre-commit checks**
   ```bash
   # Add to .husky/pre-commit
   pnpm check-links
   ```

3. **Pull request validation**
   - Run link checker in CI
   - Block merge on broken links
   - Review link checker output

4. **Scheduled external link checks**
   - Weekly cron job for external links
   - Alert team on broken external links
   - Update or remove dead links

### Documentation Standards

1. **Use relative links for internal navigation**
   ```markdown
   <!-- Good -->
   [Getting Started](./getting-started.md)

   <!-- Avoid -->
   [Getting Started](https://example.com/docs/getting-started)
   ```

2. **Verify anchors exist**
   ```markdown
   <!-- Ensure the target heading exists -->
   [Architecture](#architecture)

   ## Architecture
   <!-- ... -->
   ```

3. **Keep links maintainable**
   - Use consistent file naming
   - Avoid deep nesting
   - Document link structure

## Troubleshooting

### Link checker not running

**Check:**
1. Is `prebuild` script configured?
2. Is `scripts/check-links.mjs` executable?
3. Are dependencies installed?

```bash
# Verify scripts
cat package.json | grep -A 3 '"scripts"'

# Run manually
node scripts/check-links.mjs

# Check file permissions
ls -la scripts/check-links.mjs
```

### Too many false positives

**Solutions:**
1. Add patterns to `exclude` in config
2. Add domains to `skipDomains`
3. Adjust `validExtensions`
4. Review link formats

### Performance issues

**Solutions:**
1. Disable external link checking
2. Reduce `concurrency` (if hitting rate limits)
3. Add more patterns to `exclude`
4. Run link checker separately from build

## API Reference

### Script Location

`/scripts/check-links.mjs`

### Environment Variables

- `BUILD_SKIP_LINK_CHECK=1` - Skip link validation entirely

### Exit Codes

- `0` - All links valid
- `1` - Broken links found or error occurred

### Output Format

```
🔗 Starting link validation...

📁 Base directory: docs
📄 Patterns: **/*.md, **/*.mdx

Found 25 markdown file(s)
Extracted 309 link(s)
Checking 220 internal link(s)...

🔍 Link Validation Results

❌ Broken Links (2):

  /docs/index.md:127
    Link: ./plugins/navigation.md
    Error: File not found: /docs/plugins/navigation.md

  /docs/guide.md:42
    Link: ./page.md#section
    Error: Anchor #section not found in /docs/page.md

📊 Summary:
  Total links:  220
  Valid:        218
  Broken:       2

💔 Found 2 broken link(s)
```

## See Also

- [Architecture Guide](./architecture.md) - System design and philosophy
- [Migration Guide](./migration.md) - Migrating from v1.x to v2.x
- [Examples](./examples.md) - Code examples and recipes
