# Git Integration Features

## Problem

Open source documentation lacks key Git-powered features that help contributors:
- No "Edit this page" link to encourage contributions
- No "Last updated" timestamp showing content freshness
- No contributor attribution

These features are standard in Docusaurus, VitePress, and Nextra, making docs-engine feel less polished for open-source projects hosted on GitHub/GitLab.

## Solution

Add Git integration utilities that extract metadata from Git history and generate edit links based on repository configuration.

**Features:**
1. "Edit this page" link pointing to GitHub/GitLab
2. Last updated timestamp from Git commit history
3. Contributors list with avatars (optional)

## Checklists

### Configuration
- [ ] Add `gitConfig` option to docs-engine config
- [ ] Support `repoUrl` (e.g., `https://github.com/user/repo`)
- [ ] Support `branch` (default: `main`)
- [ ] Support `docsPath` (default: `docs`)
- [ ] Support `editLinkText` (default: `Edit this page`)

### Git Utilities
- [ ] Create `src/lib/utils/git.ts` module
- [ ] Implement `getLastUpdated(filePath: string): Date | null` using `git log`
- [ ] Implement `getContributors(filePath: string): Contributor[]` using `git log`
- [ ] Implement `generateEditLink(filePath: string, config: GitConfig): string`
- [ ] Handle both GitHub and GitLab URL formats
- [ ] Cache Git command results for performance

### Components
- [ ] Create `EditThisPage.svelte` component
  - [ ] Render edit icon + text link
  - [ ] Link to Git provider edit URL
  - [ ] Style consistently with docs theme
- [ ] Create `PageMetadata.svelte` component
  - [ ] Show "Last updated: X days ago"
  - [ ] Show contributor avatars (optional)
  - [ ] Format dates relative (e.g., "2 days ago")

### Integration
- [ ] Add Git metadata to page load function
- [ ] Pass Git data to layout components
- [ ] Position "Edit this page" near page title or footer
- [ ] Position "Last updated" in footer or sidebar

### Error Handling
- [ ] Handle missing Git repository gracefully
- [ ] Handle detached HEAD state
- [ ] Handle files not yet committed
- [ ] Log warnings without breaking builds

### Documentation
- [ ] Document Git config options in README.md
- [ ] Add setup guide for GitHub/GitLab integration
- [ ] Document contributor avatar fetching
- [ ] Show examples with different Git providers

## Success Criteria

- "Edit this page" link appears on all documentation pages when Git config is provided
- Link opens correct file in GitHub/GitLab editor
- "Last updated" timestamp shows accurate Git commit date
- Contributors list shows avatars from Git history (if enabled)
- Feature works with GitHub, GitLab, and Gitea
- Gracefully degrades when Git is unavailable (no errors)

## Benefits

- Encourages open-source contributions with easy edit links
- Shows content freshness with last updated timestamps
- Recognizes contributors with attribution
- Matches feature set of competing documentation tools
- Builds trust by showing documentation maintenance status
- Improves SEO with structured metadata
