# CLI Scaffolding Tool

## Problem

New users must manually:
- Create SvelteKit project structure
- Install docs-engine and dependencies
- Configure mdsvex plugins
- Set up hydrators and styles
- Create initial documentation files

This high barrier to entry slows adoption. Competitors offer one-command scaffolding (Docusaurus, VitePress, Nextra all have `create-*` tools).

## Solution

Create `create-docs-engine` CLI tool that generates a ready-to-run documentation site with best practices configured.

**Command:**
```bash
npx create-docs-engine my-docs
cd my-docs
pnpm dev  # Works immediately
```

## Checklists

### CLI Tool Setup
- [ ] Create `packages/create-docs-engine` package
- [ ] Set up package.json with bin entry
- [ ] Add dependencies: prompts, degit, chalk, ora
- [ ] Configure TypeScript build
- [ ] Add shebang (`#!/usr/bin/env node`)

### Interactive Prompts
- [ ] Prompt for project name (default: current directory)
- [ ] Prompt for package manager (npm/pnpm/yarn)
- [ ] Prompt for features to include:
  - [ ] Screenshots (web + CLI)
  - [ ] Mermaid diagrams
  - [ ] Math equations (KaTeX)
  - [ ] GitHub integration (edit links)
- [ ] Prompt for Git repository URL (optional, for edit links)

### Template Generation
- [ ] Create template directory in `packages/create-docs-engine/template/`
- [ ] Add SvelteKit project structure:
  - [ ] `src/routes/+layout.svelte`
  - [ ] `src/routes/docs/[...slug]/+page.svelte`
  - [ ] `src/routes/docs/[...slug]/+page.server.ts`
  - [ ] `svelte.config.js` with mdsvex
  - [ ] `vite.config.ts`
  - [ ] `package.json` with docs-engine
- [ ] Add starter documentation in `docs/`:
  - [ ] `index.md` (homepage)
  - [ ] `getting-started.md`
  - [ ] `features.md`
- [ ] Add `.gitignore`, `README.md`
- [ ] Add example content showing all features

### File Generation
- [ ] Copy template files to target directory
- [ ] Replace placeholders (project name, repo URL)
- [ ] Generate `svelte.config.js` with selected plugins
- [ ] Generate layout with selected hydrators
- [ ] Install dependencies with chosen package manager
- [ ] Initialize git repository
- [ ] Create initial commit

### CLI Output
- [ ] Show spinner during installation
- [ ] Show success message with next steps
- [ ] Display helpful commands:
  ```
  cd my-docs
  pnpm dev       # Start dev server
  pnpm build     # Build for production
  pnpm preview   # Preview production build
  ```
- [ ] Use colors and formatting (chalk)
- [ ] Show estimated completion time

### Error Handling
- [ ] Handle existing directory (prompt to overwrite or choose different name)
- [ ] Handle network failures (dependency installation)
- [ ] Handle permission errors
- [ ] Provide clear error messages with solutions
- [ ] Offer to clean up on failure

### Testing
- [ ] Test with npm, pnpm, and yarn
- [ ] Test on macOS, Linux, and Windows
- [ ] Test with all feature combinations
- [ ] Verify generated project runs without errors
- [ ] Test with existing directories

### Documentation
- [ ] Add README.md to create-docs-engine package
- [ ] Document CLI options and flags
- [ ] Document template customization
- [ ] Add troubleshooting guide
- [ ] Update main docs-engine README with scaffolding instructions

### Publishing
- [ ] Publish to npm as `create-docs-engine`
- [ ] Set up automated releases with CI
- [ ] Add version command (`--version`)
- [ ] Add help command (`--help`)

## Success Criteria

- Running `npx create-docs-engine my-docs` generates a working project
- Generated project runs `pnpm dev` without errors
- All selected features are configured correctly
- Documentation site is immediately viewable at `localhost:5173`
- User can add markdown files to `docs/` and see them rendered
- Process completes in under 60 seconds
- Works on all major platforms (macOS, Linux, Windows)

## Benefits

- Dramatically lowers adoption barrier for new users
- Ensures best practices are followed from the start
- Reduces setup time from 30+ minutes to under 1 minute
- Provides working example showing all features
- Matches DX expectations set by competing tools
- Increases docs-engine adoption and community growth
- Eliminates configuration errors and setup frustration
