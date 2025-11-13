# Build Scripts

This directory contains build-time scripts for the docs-engine project.

## check-links.mjs

Validates internal and external links in markdown documentation.

### Usage

```bash
# Run from project root
node scripts/check-links.mjs

# Run via npm/pnpm
pnpm check-links

# Skip link checking
BUILD_SKIP_LINK_CHECK=1 node scripts/check-links.mjs
```

### Features

- ✅ Validates internal markdown links
- ✅ Checks file existence
- ✅ Verifies anchor links
- ✅ Configurable via `.linkcheckerrc.json`
- ✅ Fast (internal links only by default)
- ✅ Detailed error reporting
- ✅ Integrated into build process

### Configuration

The script loads configuration from:
1. `.linkcheckerrc.json`
2. `.linkcheckerrc`
3. `linkchecker.config.json`

If no config file is found, it uses default configuration.

### Environment Variables

- `BUILD_SKIP_LINK_CHECK=1` - Skip all link validation

### Exit Codes

- `0` - Success (all links valid)
- `1` - Failure (broken links found or error)

### Integration

The script is integrated into the build process via `prebuild` script in `package.json`:

```json
{
  "scripts": {
    "check-links": "node scripts/check-links.mjs",
    "prebuild": "npm run check-links",
    "build": "tsup"
  }
}
```

This ensures link validation runs before every build.

### Performance

On a typical documentation site (25 files, 200+ links):
- Internal link checking: **1-2 seconds**
- With external links: **10-20 seconds** (depends on network)

### See Also

- [Link Checking Documentation](../docs/guides/link-checking.md)
- [Configuration Example](../.linkcheckerrc.json)
