# Algolia DocSearch Integration

## Problem

Basic client-side search has limitations:
- No fuzzy matching across typos
- Limited relevance ranking
- Cannot search across large documentation (1,000+ pages)
- No search analytics
- Limited filtering and faceting

For larger documentation sites, a hosted search solution is essential.

## Solution

Integrate Algolia DocSearch - the industry-standard search solution for documentation.

**Why Algolia:**
- Free for open source projects
- Used by Vue, React, Tailwind, and most major docs sites
- Handles indexing automatically via crawler
- Built-in analytics and insights
- Professional search UX out of the box

## Checklists

### Configuration
- [ ] Add `algoliaConfig` to docs-engine config
- [ ] Support `appId`, `apiKey`, `indexName` parameters
- [ ] Support `placeholder` text customization
- [ ] Support `searchParameters` for custom ranking
- [ ] Document how to apply for free DocSearch program

### Component Integration
- [ ] Create `AlgoliaDocSearch.svelte` component wrapper
- [ ] Integrate @docsearch/js library
- [ ] Replace or enhance basic Cmd+K search modal
- [ ] Support Cmd+K / Ctrl+K keyboard shortcut
- [ ] Ensure works with SSR (load client-side only)

### Styling
- [ ] Import Algolia DocSearch CSS
- [ ] Customize styles to match docs-engine theme
- [ ] Support dark mode styling
- [ ] Ensure mobile-responsive search modal
- [ ] Match button styling with navigation

### Crawler Configuration
- [ ] Generate `docsearch.json` crawler config
- [ ] Configure selectors for content extraction
- [ ] Set up indexing schedule
- [ ] Handle versioned docs in crawler config
- [ ] Handle multi-language docs in crawler config
- [ ] Test crawler locally with docker

### Index Optimization
- [ ] Configure searchable attributes (title, headings, content)
- [ ] Set ranking weights (title > heading > content)
- [ ] Configure facets (version, locale, section)
- [ ] Exclude pages via frontmatter (`searchable: false`)
- [ ] Configure custom stopwords if needed

### Analytics Integration
- [ ] Enable Algolia Insights
- [ ] Track search queries
- [ ] Track click-through rates
- [ ] View analytics in Algolia dashboard
- [ ] Optional: Export to Google Analytics

### Documentation
- [ ] Document Algolia DocSearch setup in README.md
- [ ] Document how to apply for free open source program
- [ ] Document crawler configuration
- [ ] Document search customization options
- [ ] Add troubleshooting guide for common issues
- [ ] Show example configuration

## Success Criteria

- Algolia DocSearch integrates seamlessly with docs-engine
- Search modal opens with Cmd+K keyboard shortcut
- Search quality is excellent (fuzzy matching, typo tolerance)
- Supports large documentation sets (10,000+ pages)
- Search works with versioned and multi-language docs
- Analytics track search usage and quality
- Crawler indexes documentation automatically
- Styling matches docs-engine theme
- Feature parity with Vue/React/Tailwind docs

## Benefits

- Professional search experience used by major frameworks
- Free for open source projects
- No search infrastructure to maintain
- Automatic indexing via crawler
- Built-in analytics and insights
- Excellent typo tolerance and relevance ranking
- Proven at scale (handles millions of queries)
- Increases docs-engine appeal for serious documentation projects
