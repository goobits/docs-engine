# @goobits/docs-engine-cli

Command-line tools for managing and validating documentation built with @goobits/docs-engine.

## Features

- ✅ **Link validation** - Check internal and external links
- 🔍 **Anchor checking** - Validate anchor links (#section)
- 📁 **File existence** - Ensure linked files exist
- 🌐 **External validation** - HTTP requests to validate external URLs
- ⚡ **Performance** - Concurrent checking with configurable limits
- 🎨 **Beautiful output** - Color-coded results with chalk
- ⚙️ **Configurable** - Support for config files
- 🔄 **CI-friendly** - JSON output and non-zero exit codes

## Installation

```bash
pnpm add -D @goobits/docs-engine-cli
```

## Usage

### Basic Link Checking

Check all markdown files in the current directory:

```bash
pnpm docs-engine check-links
```

### Check External Links

Validate external URLs (slower):

```bash
pnpm docs-engine check-links --external
```

### Custom Base Directory

Specify a custom base directory:

```bash
pnpm docs-engine check-links --base-dir ./docs
```

### Quiet Mode (Errors Only)

Only show errors:

```bash
pnpm docs-engine check-links --quiet
```

### Verbose Mode

Show all links including valid ones:

```bash
pnpm docs-engine check-links --verbose
```

### JSON Output

Output results as JSON for programmatic use:

```bash
pnpm docs-engine check-links --json > results.json
```

## CLI Options

```
check-links [options]

Options:
  -b, --base-dir <path>      Base directory for docs (default: current directory)
  -p, --pattern <glob>       Glob pattern for markdown files (default: **/*.md)
  -e, --external             Validate external links (slower)
  -t, --timeout <ms>         Timeout for external requests in ms (default: 5000)
  -c, --concurrency <num>    Max concurrent external requests (default: 10)
  -q, --quiet                Only show errors
  -v, --verbose              Show all links including valid ones
  --json                     Output results as JSON
  --config <path>            Path to config file
  -h, --help                 Display help
```

## Configuration File

Create a `.linkcheckerrc.json` file in your project root:

```json
{
  "baseDir": "./docs",
  "include": ["**/*.md", "**/*.mdx"],
  "exclude": ["**/node_modules/**", "**/dist/**"],
  "checkExternal": false,
  "timeout": 5000,
  "concurrency": 10,
  "skipDomains": ["localhost", "127.0.0.1", "example.com"],
  "validExtensions": [".md", ".mdx"]
}
```

### Configuration Options

- **`baseDir`** (string): Base directory for resolving relative links
- **`include`** (string[]): Glob patterns for files to check
- **`exclude`** (string[]): Glob patterns for files to ignore
- **`checkExternal`** (boolean): Whether to validate external links
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
        # Fails CI if broken links found
```

### GitLab CI

```yaml
link-check:
  image: node:20
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm docs-engine check-links
  only:
    - merge_requests
    - main
```

## Examples

### Check Only Internal Links

```bash
pnpm docs-engine check-links
```

Output:
```
✓ Found 25 markdown file(s)
✓ Extracted 147 link(s)
✓ Validation complete

🔍 Link Validation Results

❌ Files Not Found (2):

  docs/guide.md:42 guide/installation.md
    File not found: /project/docs/guide/installation.md

  docs/api.md:15 ../reference/api.md
    File not found: /project/reference/api.md

📊 Summary:

  Total links:     147
  Valid:           145
  Broken:          2
  Internal:        147
  External:        0

💔 Found 2 broken link(s)
```

### Check External Links

```bash
pnpm docs-engine check-links --external
```

Output:
```
❌ External Link Errors (1):

  docs/resources.md:23 https://example.com/old-page
    HTTP 404 - Not Found

📊 Summary:

  Total links:     147
  Valid:           146
  Broken:          1
  Internal:        120
  External:        27
```

### JSON Output for Parsing

```bash
pnpm docs-engine check-links --json | jq '.[] | select(.isValid == false)'
```

## Exit Codes

- **0**: All links are valid
- **1**: Broken links found or execution error

This makes it perfect for CI/CD pipelines - the build will fail if broken links are detected.

## Development

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Link for local testing
pnpm link --global

# Test the CLI
docs-engine check-links
```

## License

MIT © GooBits
