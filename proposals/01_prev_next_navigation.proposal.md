# Previous/Next Page Navigation

## Problem

Users navigating documentation must return to the sidebar to find the next logical page to read. There is no automatic sequential navigation between related documents, reducing discoverability and reading flow.

Competitors (Docusaurus, VitePress, Nextra) automatically generate "Previous" and "Next" links at the bottom of each page based on sidebar order.

## Solution

Add automatic previous/next navigation links at the bottom of documentation pages based on navigation structure order.

**Approach:**
- Use existing `buildNavigation()` output to determine page order
- Flatten navigation sections into sequential page list
- Match current page to find prev/next
- Render `DocsPrevNext.svelte` component at bottom of page

## Checklists

### Core Implementation
- [ ] Create `getPrevNextLinks()` utility function in `src/lib/utils/navigation.ts`
- [ ] Flatten `DocsSection[]` into ordered `DocsLink[]` array respecting section order
- [ ] Find current page index in flattened list
- [ ] Return `{ prev: DocsLink | null, next: DocsLink | null }`
- [ ] Handle first page (prev = null) and last page (next = null)

### Component
- [ ] Create `DocsPrevNext.svelte` component
- [ ] Accept `prev` and `next` props (DocsLink | null)
- [ ] Render left-aligned "Previous" button with arrow
- [ ] Render right-aligned "Next" button with arrow
- [ ] Show page title and optional description in buttons
- [ ] Style as large, clickable cards
- [ ] Add hover states

### Integration
- [ ] Update `DocsLayout.svelte` to include `DocsPrevNext` component
- [ ] Pass current path to determine prev/next
- [ ] Position above footer or as final content section
- [ ] Ensure works with custom layouts

### Styling
- [ ] Add CSS variables for prev/next button styling
- [ ] Ensure accessibility (focus states, keyboard navigation)
- [ ] Make responsive (stack vertically on mobile)
- [ ] Match docs-engine design system

### Documentation
- [ ] Document in README.md under "Navigation" section
- [ ] Add example showing prev/next at page bottom
- [ ] Document how to disable for specific pages (frontmatter option)

## Success Criteria

- Every documentation page shows Previous/Next links at bottom (except first/last)
- Links respect navigation order from `buildNavigation()`
- Clicking Previous/Next navigates to correct page
- Component is keyboard accessible and properly styled
- Optional frontmatter field to disable: `showPrevNext: false`

## Benefits

- Improved reading flow - users can read docs sequentially without sidebar
- Better discoverability of related content
- Matches UX expectations from other documentation tools
- Reduced navigation friction
- Encourages users to explore more documentation pages
