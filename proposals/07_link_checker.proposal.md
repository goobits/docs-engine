# Link Checker CLI

## Problem

Documentation accumulates broken links over time:
- Internal links to renamed/moved pages
- External links to deprecated URLs
- Broken anchor links (#section)
- Links to non-existent files

Manual link checking is tedious and error-prone. Broken links damage user trust and SEO. Competitors have built-in link validation or recommend external tools.

## Solution

Create standalone CLI tool that validates all internal and external links in documentation.

**Usage:**
```bash
pnpm docs-engine check-links
pnpm docs-engine check-links --external
pnpm docs-engine check-links --fix
```

## Checklists

### CLI Tool Setup
- [ ] Create `packages/docs-engine-cli` package
- [ ] Set up package.json with bin entry
- [ ] Add dependencies: commander, chalk, ora, glob
- [ ] Configure TypeScript build
- [ ] Add shebang for direct execution

### Link Extraction
- [ ] Recursively scan markdown files in docs directory
- [ ] Parse markdown with unified/remark
- [ ] Extract all markdown links `[text](url)`
- [ ] Extract HTML links `<a href="url">`
- [ ] Extract image links `![alt](url)`
- [ ] Store source file and line number for each link

### Internal Link Validation
- [ ] Check if internal markdown files exist
- [ ] Validate anchor links (#section) exist in target files
- [ ] Check relative paths (./file.md, ../file.md)
- [ ] Check absolute paths (/docs/file.md)
- [ ] Handle SvelteKit route transformations (.md → route path)
- [ ] Report missing files and broken anchors

### External Link Validation
- [ ] Make HTTP HEAD requests to external URLs
- [ ] Follow redirects (up to 5)
- [ ] Validate response codes (200-299 = success)
- [ ] Handle timeouts gracefully (5s timeout)
- [ ] Rate limit requests (max 10 concurrent)
- [ ] Cache results to avoid re-checking same URLs
- [ ] Skip validation for specific domains (via config)

### Error Reporting
- [ ] Group errors by type (404, anchor, external)
- [ ] Show file path and line number for each broken link
- [ ] Show link text and URL
- [ ] Color code errors (red) and warnings (yellow)
- [ ] Summary statistics (total links, broken, warnings)
- [ ] Exit with non-zero code if broken links found

### Auto-fix (Optional)
- [ ] Suggest fixes for common issues
- [ ] Update moved file paths automatically
- [ ] Fix case sensitivity issues
- [ ] Prompt for confirmation before applying fixes

### Configuration
- [ ] Support `.linkcheckerrc.json` config file
- [ ] Configure ignore patterns (glob)
- [ ] Configure external link timeout
- [ ] Configure retry attempts
- [ ] Configure domains to skip
- [ ] Configure base URL for absolute paths

### CI Integration
- [ ] Exit code 1 on broken links (fails CI)
- [ ] Support `--quiet` mode (only errors)
- [ ] Support `--json` output for parsing
- [ ] Support `--max-external-links` limit
- [ ] GitHub Actions example in docs

### Performance
- [ ] Parallel checking with worker threads
- [ ] Cache external link results (24hr TTL)
- [ ] Skip checking same URL multiple times
- [ ] Progress indicator with ETA
- [ ] Handle large documentation sites (1000+ pages)

### Documentation
- [ ] Add README.md to CLI package
- [ ] Document all CLI flags and options
- [ ] Document config file format
- [ ] Add CI integration examples
- [ ] Document common error patterns and fixes

## Success Criteria

- CLI scans all markdown files and extracts links
- Internal links are validated against filesystem
- Anchor links are validated against target documents
- External links are validated with HTTP requests (when enabled)
- Broken links are reported with file/line numbers
- Tool completes in reasonable time (<30s for 100 pages)
- Can be integrated into CI/CD pipeline
- Non-zero exit code on failures (CI integration)
- JSON output mode for programmatic use

## Benefits

- Prevents broken links from reaching production
- Improves documentation quality and user trust
- Better SEO (search engines penalize broken links)
- Catches issues during content migration
- Can run in CI to prevent merging broken links
- Standalone tool usable with any markdown docs
- Reduces manual QA burden
- Professional quality assurance for documentation
