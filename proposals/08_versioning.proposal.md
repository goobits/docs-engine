# Multi-Version Documentation

## Problem

Library and API documentation needs to maintain docs for multiple versions simultaneously. Users on v1.x need v1 docs, users on v2.x need v2 docs. Currently, docs-engine only supports single-version documentation, making it unsuitable for:
- API libraries with breaking changes between versions
- Software with LTS versions
- Projects maintaining multiple release branches

Docusaurus has built-in versioning as a core feature. Without this, docs-engine cannot compete for library documentation.

## Solution

Add multi-version documentation support with version switching, version-aware navigation, and separate builds per version.

**Structure:**
```
docs/
  current/          # Latest development version
  versioned_docs/
    version-2.0/    # v2.0 docs
    version-1.5/    # v1.5 docs
```

**URLs:**
- `/docs/` - Latest/current version
- `/docs/v2.0/` - Version 2.0
- `/docs/v1.5/` - Version 1.5

## Checklists

### Version Structure
- [ ] Define version directory structure
- [ ] Create `versions.json` config file listing all versions
- [ ] Support version labels (latest, stable, legacy)
- [ ] Copy current docs to versioned folder on release
- [ ] Support version-specific navigation
- [ ] Handle version in routing (`/docs/v2.0/[...slug]`)

### Version Switcher Component
- [ ] Create `VersionSwitcher.svelte` dropdown component
- [ ] List all available versions
- [ ] Show current version with label (latest/stable)
- [ ] Navigate to same page in different version
- [ ] Fallback to home if page doesn't exist in target version
- [ ] Show version in URL and persist selection
- [ ] Style as dropdown in navbar or sidebar

### Version Banner
- [ ] Create `VersionBanner.svelte` component
- [ ] Show warning when viewing old version
- [ ] Link to latest version of current page
- [ ] Different messages for deprecated vs. outdated versions
- [ ] Dismissible banner with localStorage persistence
- [ ] Customizable banner text via config

### Navigation Per Version
- [ ] Load version-specific navigation
- [ ] Build separate nav for each version directory
- [ ] Version-aware sidebar links
- [ ] Handle missing pages in older versions
- [ ] Support version-specific ordering

### Search Per Version
- [ ] Build separate search indexes per version
- [ ] Filter search results by current version
- [ ] Option to search across all versions
- [ ] Show version tag in search results
- [ ] Link to correct version in results

### Configuration
- [ ] Add `versioningConfig` to docs-engine config
- [ ] Support `currentVersion` (default: latest)
- [ ] Support `versions` array with metadata
- [ ] Support `defaultVersion` (what to show at /docs/)
- [ ] Support version aliases (latest, stable, next)
- [ ] Support deprecation dates and messages

### CLI Commands
- [ ] Add `docs-engine version create <version>` command
- [ ] Copy current docs to versioned_docs/version-X
- [ ] Update versions.json
- [ ] Add `docs-engine version list` command
- [ ] Add `docs-engine version delete <version>` command

### Build Process
- [ ] Generate routes for all versions
- [ ] Build separate pages per version
- [ ] Handle version in static path generation
- [ ] Optimize build time (don't rebuild unchanged versions)
- [ ] Support version-specific assets

### Documentation
- [ ] Document versioning workflow in README.md
- [ ] Document how to create new version
- [ ] Document version directory structure
- [ ] Document version configuration options
- [ ] Add guide for maintaining multiple versions
- [ ] Document migration between versions

## Success Criteria

- Can maintain docs for multiple versions (v1, v2, v3)
- Version switcher allows navigation between versions
- Each version has its own navigation and search index
- Banner appears when viewing old versions
- CLI command creates new version in one step
- URLs are clean and SEO-friendly (/docs/v2.0/page)
- Same page across versions is accessible
- Feature parity with Docusaurus versioning

## Benefits

- Enables library and API documentation use cases
- Users on old versions can access relevant docs
- Supports LTS and multiple release branches
- Clear migration paths between versions
- Professional multi-version management
- Competitive with Docusaurus for library docs
- Reduces confusion for users on different versions
