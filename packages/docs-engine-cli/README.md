# docs-engine-cli

CLI tools for docs-engine including link checking and version management.

## Installation

```bash
npm install -g docs-engine-cli
# or
pnpm add -g docs-engine-cli
```

## Commands

### Link Checker

Validate all internal and external links in your documentation.

```bash
# Check internal links only
docs-engine check-links

# Check internal and external links
docs-engine check-links --external

# Check with custom docs directory
docs-engine check-links --docs-dir ./documentation

# Skip specific domains
docs-engine check-links --external --skip-domains example.com,test.com

# JSON output for CI integration
docs-engine check-links --json

# Quiet mode (errors only)
docs-engine check-links --quiet
```

**Options:**

- `-d, --docs-dir <path>` - Documentation directory (default: `docs`)
- `-e, --external` - Check external links (default: `false`)
- `-t, --timeout <ms>` - External link timeout in ms (default: `5000`)
- `-c, --concurrency <n>` - Max concurrent external requests (default: `10`)
- `--skip-domains <domains>` - Domains to skip (comma-separated)
- `--json` - Output JSON format
- `-q, --quiet` - Only show errors

**Exit Codes:**
- `0` - All links valid
- `1` - Broken links found

### Version Management

Manage multiple versions of your documentation.

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

## CI Integration

### GitHub Actions Example

```yaml
name: Check Links

on: [pull_request]

jobs:
  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g docs-engine-cli
      - run: docs-engine check-links
```

### Pre-commit Hook

```bash
#!/bin/sh
docs-engine check-links --quiet || exit 1
```

## Configuration

Create `.linkcheckerrc.json` in your project root:

```json
{
  "docsDir": "docs",
  "checkExternal": true,
  "timeout": 5000,
  "concurrency": 10,
  "skipDomains": [
    "localhost",
    "127.0.0.1",
    "example.com"
  ],
  "ignorePatterns": [
    "**/node_modules/**",
    "**/dist/**"
  ]
}
```

## Versioning Workflow

### 1. Initial Setup

Start with your documentation in `docs/`:

```
docs/
  getting-started.md
  api-reference.md
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

## Link Checker Details

### Internal Link Validation

- ✅ Relative links (`./page.md`, `../other.md`)
- ✅ Absolute links (`/docs/page.md`)
- ✅ Anchor links (`#section`, `page.md#section`)
- ✅ Markdown and HTML links
- ✅ Image links

### External Link Validation

- ✅ HTTP/HTTPS URLs
- ✅ Follow redirects (up to 5)
- ✅ Timeout handling
- ✅ Rate limiting
- ✅ Result caching
- ✅ Domain skipping

### Error Types

- **404 Not Found** - File doesn't exist
- **Anchor Not Found** - Section anchor missing
- **Network Error** - External URL unreachable
- **Timeout** - External URL took too long

## License

MIT
