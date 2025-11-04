# Cmd+K Search Experience

## Problem

Current search implementation lacks the instant, keyboard-driven UX that users expect from modern documentation:
- No keyboard shortcut to activate search (Cmd+K / Ctrl+K)
- No search-as-you-type with instant results
- No modal overlay with keyboard navigation
- Search is buried in sidebar rather than globally accessible
- No fuzzy matching or result highlighting

Users expect Cmd+K search as a standard feature (Algolia DocSearch, Spotlight-style search).

## Solution

Implement a Cmd+K search modal with instant fuzzy search, keyboard navigation, and result highlighting.

**Approach:**
- Create keyboard-triggered search modal overlay
- Implement client-side fuzzy search with Fuse.js or MiniSearch
- Add keyboard navigation (arrow keys, Enter, Escape)
- Highlight matching text in results
- Show section context for each result

## Checklists

### Search Infrastructure
- [ ] Choose search library (Fuse.js or MiniSearch)
- [ ] Create search index builder in `src/lib/utils/search-index.ts`
- [ ] Index document titles, descriptions, headings, and content
- [ ] Weight fields (title > heading > description > content)
- [ ] Generate search index at build time
- [ ] Serialize index to JSON for client-side loading

### Search Modal Component
- [ ] Create `SearchModal.svelte` component
- [ ] Add backdrop overlay with blur effect
- [ ] Create centered search input with large text
- [ ] Add results list with sections
- [ ] Show result title, excerpt, and breadcrumbs
- [ ] Highlight matching text in results
- [ ] Show keyboard shortcuts (↑↓ to navigate, Enter to select, Esc to close)

### Keyboard Handling
- [ ] Register global Cmd+K / Ctrl+K keyboard listener
- [ ] Open modal on Cmd+K
- [ ] Close modal on Escape
- [ ] Navigate results with arrow keys
- [ ] Select result with Enter
- [ ] Focus search input when modal opens
- [ ] Trap focus within modal when open

### Search Logic
- [ ] Implement fuzzy search with configurable threshold
- [ ] Return top 10 most relevant results
- [ ] Include result score and matched positions
- [ ] Group results by section
- [ ] Show "No results" state with helpful message
- [ ] Debounce search input (200ms)

### Styling
- [ ] Style modal with glassmorphism effect
- [ ] Add CSS animations (fade in, scale up)
- [ ] Style search input with icon
- [ ] Style result items with hover states
- [ ] Style highlighted text (bold or colored)
- [ ] Make mobile-friendly (full-screen on small screens)

### Integration
- [ ] Add search modal to root layout
- [ ] Load search index on first search
- [ ] Show loading state while index loads
- [ ] Add search icon to navigation with Cmd+K hint
- [ ] Ensure works with SSR (hydrate client-side only)

### Performance
- [ ] Lazy load search index (don't load until needed)
- [ ] Cache search index after first load
- [ ] Optimize index size (gzip compression)
- [ ] Test with large documentation sites (1000+ pages)

### Documentation
- [ ] Document search configuration options in README.md
- [ ] Document how to customize search weights
- [ ] Document how to exclude pages from search (frontmatter: `searchable: false`)
- [ ] Add troubleshooting guide for search index issues

## Success Criteria

- Pressing Cmd+K (Mac) or Ctrl+K (Windows/Linux) opens search modal
- Search returns relevant results instantly (<100ms)
- Keyboard navigation works (arrows, Enter, Esc)
- Matching text is highlighted in results
- Modal is accessible and keyboard-friendly
- Search index is lazy-loaded and doesn't impact initial page load
- Search works with 1000+ pages without performance degradation

## Benefits

- Modern search UX matching user expectations
- Faster documentation discovery
- Reduced reliance on sidebar navigation
- Better accessibility with keyboard-first design
- Competitive feature parity with Docusaurus/VitePress
- Improved user satisfaction and documentation usability
