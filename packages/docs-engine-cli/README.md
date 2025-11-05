# @goobits/docs-engine-cli

Command-line tools for managing and validating documentation built with @goobits/docs-engine.

## Features

- ✅ **Link validation** - Check internal and external links
- 🔍 **Anchor checking** - Validate anchor links (#section)
- 📁 **File existence** - Ensure linked files exist
- 🌐 **External validation** - HTTP requests to validate external URLs
- 📦 **Version management** - Manage multiple documentation versions
- ⚡ **Performance** - Concurrent checking with configurable limits
- 🎨 **Beautiful output** - Color-coded results with chalk
- ⚙️ **Configurable** - Support for config files
- 🔄 **CI-friendly** - JSON output and non-zero exit codes

## Installation

```bash
pnpm add -D @goobits/docs-engine-cli
# or
npm install --save-dev @goobits/docs-engine-cli
```

## Commands

### Link Checker

Check all links in your markdown documentation for broken internal references and optionally validate external URLs.

```bash
# Basic usage - check internal links
docs-engine check-links

# Check with external link validation
docs-engine check-links --external

# Custom base directory
docs-engine check-links --base-dir ./documentation

# Quiet mode (only show errors)
docs-engine check-links --quiet

# JSON output for CI integration
docs-engine check-links --json
```

**Options:**

- `-b, --base-dir <path>` - Base directory for documentation (default: current directory)
- `-p, --pattern <glob>` - Glob pattern for files to check (default: `**/*.{md,mdx}`)
- `-e, --external` - Validate external links (slower, default: `false`)
- `-t, --timeout <ms>` - External link timeout in milliseconds (default: `5000`)
- `-c, --concurrency <number>` - Max concurrent external requests (default: `10`)
- `-q, --quiet` - Only show errors, hide valid links
- `--json` - Output results as JSON
- `--config <path>` - Path to config file

**Exit Codes:**
- `0` - All links valid
- `1` - Broken links found or error occurred

### Version Management

Manage multiple versions of your documentation (similar to Docusaurus versioning).

#### Create Version

Create a new documentation version from current docs:

```bash
# Create version 2.0
docs-engine version create 2.0

# Create with custom docs directory
docs-engine version create 2.0 --docs-dir ./documentation
```

This will:
1. Copy current docs to `docs/versioned_docs/version-2.0/`
2. Update `docs/versions.json` with the new version
3. Mark the new version as "latest"

#### List Versions

List all available documentation versions:

```bash
docs-engine version list

# Output:
#   2.0 [latest]
#   1.5 [stable]
#   1.0 [legacy]
```

#### Delete Version

Delete a documentation version:

```bash
docs-engine version delete 1.0

# Skip confirmation
docs-engine version delete 1.0 --force
```

## Configuration

### Config File

Create `.docs-engine.json` in your project root:

```json
{
  "baseDir": ".",
  "pattern": "docs/**/*.{md,mdx}",
  "checkExternal": false,
  "timeout": 5000,
  "concurrency": 10,
  "exclude": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**"
  ],
  "skipDomains": [
    "localhost",
    "127.0.0.1",
    "example.com"
  ],
  "validExtensions": [".md", ".mdx"]
}
```

**Configuration Options:**

- **`baseDir`** (string): Base directory for documentation
- **`pattern`** (string): Glob pattern for files to check
- **`checkExternal`** (boolean): Whether to validate external links
- **`exclude`** (string[]): Patterns to exclude from checking
- **`timeout`** (number): Timeout for external requests in milliseconds
- **`concurrency`** (number): Maximum concurrent external requests
- **`skipDomains`** (string[]): Domains to skip validation
- **`validExtensions`** (string[]): File extensions to treat as valid

## CI Integration

### GitHub Actions

```yaml
name: Check Links

on: [push, pull_request]

jobs:
  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm docs-engine check-links

      # Optional: Check external links on schedule
      - name: Check external links
        if: github.event_name == 'schedule'
        run: pnpm docs-engine check-links --external
```

### Pre-commit Hook

```bash
#!/bin/sh
docs-engine check-links --quiet || exit 1
```

## Versioning Workflow

### 1. Initial Setup

Start with your documentation in `docs/`:

```
docs/
  getting-started.md
  api-reference.md
  guides/
    ...
```

### 2. Create First Version

When releasing v1.0:

```bash
docs-engine version create 1.0
```

This creates:

```
docs/
  current/              # Development version
  versioned_docs/
    version-1.0/        # v1.0 release
  versions.json         # Version metadata
```

### 3. Continue Development

Keep editing files in `docs/current/` for the next release.

### 4. Release Next Version

When releasing v2.0:

```bash
docs-engine version create 2.0
```

Users can now view:
- `/docs/` - Latest (v2.0)
- `/docs/v2.0/` - v2.0 documentation
- `/docs/v1.0/` - v1.0 documentation

## Link Validation Details

### Internal Links

The link checker validates:

- **Relative links**: `./page.md`, `../other.md`
- **Absolute links**: `/docs/page.md`
- **Anchor links**: `#section`, `page.md#section`
- **Markdown links**: `[text](url)`
- **HTML links**: `<a href="url">`
- **Image links**: `![alt](image.png)`

### External Links

When `--external` is enabled:

- ✅ HTTP/HTTPS URLs validated with HEAD/GET requests
- ✅ Follow redirects (up to 5 hops)
- ✅ Configurable timeout and concurrency
- ✅ Result caching to avoid duplicate requests
- ✅ Domain skipping for local/test URLs
- ✅ Rate limiting to avoid overwhelming servers

### Error Types

- **File not found** - Internal link points to non-existent file
- **Anchor not found** - Section anchor doesn't exist in target file
- **External error** - HTTP error (404, 500, etc.)
- **Timeout** - External URL didn't respond in time
- **Network error** - Connection refused or DNS failure

## Output Examples

### Success Output

```
✔ Link checker initialized

📊 Checked 127 links across 45 files

✓ Valid: 125
⚠ Warnings: 2

All critical links are valid!
```

### Error Output

```
✖ Link checker found errors

📊 Checked 127 links across 45 files

✓ Valid: 123
✗ Broken: 4

Broken Links:

src/content/docs/api.md:45
  → /docs/missing-page.md
  ✗ File not found

src/content/docs/guide.md:12
  → ./tutorial.md#non-existent
  ✗ Anchor #non-existent not found

src/content/docs/external.md:8
  → https://example.com/broken
  ✗ 404 Not Found
```

## Development

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Test locally
node dist/index.js check-links

# Watch mode during development
pnpm dev

# Test the CLI
docs-engine check-links
```

## License

MIT © GooBits
