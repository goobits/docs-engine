<script lang="ts">
  /**
   * Docs Sidebar
   *
   * Integrated sidebar matching the docs design system
   */

  import { page } from '$app/stores';
  import { BookOpen, Search, ChevronDown, X } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { DocsSection } from '../utils/navigation';

  // Audience filter state
  const AUDIENCE_TYPES = [
    'new-users',
    'developers',
    'operators',
    'integrators',
    'contributors',
  ] as const;
  type AudienceType = (typeof AUDIENCE_TYPES)[number];

  const AUDIENCE_LABELS: Record<AudienceType, string> = {
    'new-users': 'New Users',
    developers: 'Developers',
    operators: 'Operators',
    integrators: 'Integrators',
    contributors: 'Contributors',
  };

  interface Props {
    navigation: DocsSection[];
    currentPath?: string;
    selectedAudiences?: SvelteSet<AudienceType>;
  }

  let {
    navigation,
    currentPath = '',
    selectedAudiences = $bindable(new SvelteSet<AudienceType>(['new-users', 'developers'])),
  }: Props = $props();

  // Search state
  let searchQuery = $state('');
  let searchResults = $state<Array<DocsSection['links'][number] & { section: string }>>([]);
  const defaultExpandedSections = $derived.by<Record<string, boolean>>(() =>
    Object.fromEntries(navigation.map((section) => [section.title, true]))
  );
  let expandedSections = $state<Record<string, boolean>>({});
  const allLinks = $derived.by(() =>
    navigation.flatMap((section) =>
      section.links.map((link) => ({
        ...link,
        section: section.title,
      }))
    )
  );

  // Track if we've loaded from localStorage (prevents infinite loops)
  let hasLoadedFromStorage = $state(false);

  // Load from localStorage on client (runs once on mount)
  $effect(() => {
    if (typeof window === 'undefined' || hasLoadedFromStorage) return;

    // Load audience filter
    const storedAudiences = localStorage.getItem('docs-audience-filter');
    if (storedAudiences) {
      try {
        const parsed = JSON.parse(storedAudiences);
        selectedAudiences = new SvelteSet(parsed);
      } catch {
        // Keep SSR defaults on parse error
      }
    }

    // Load expanded sections
    const storedSections = localStorage.getItem('docs-expanded-sections');
    if (storedSections) {
      try {
        const parsed = JSON.parse(storedSections);
        // Merge stored state with current navigation to handle new sections
        const merged = { ...defaultExpandedSections };
        Object.keys(parsed).forEach((key) => {
          if (key in merged) {
            merged[key] = parsed[key];
          }
        });
        expandedSections = merged;
      } catch {
        // Keep SSR defaults on parse error
      }
    }

    if (Object.keys(expandedSections).length === 0) {
      expandedSections = defaultExpandedSections;
    }

    hasLoadedFromStorage = true;
  });

  // Save audience filter to localStorage when changed
  $effect(() => {
    if (typeof window === 'undefined' || !hasLoadedFromStorage) return;
    localStorage.setItem('docs-audience-filter', JSON.stringify(Array.from(selectedAudiences)));
  });

  // Save expanded sections to localStorage when changed
  $effect(() => {
    if (typeof window === 'undefined' || !hasLoadedFromStorage) return;
    if (Object.keys(expandedSections).length > 0) {
      localStorage.setItem('docs-expanded-sections', JSON.stringify(expandedSections));
    }
  });

  // Filter navigation by selected audiences
  const filteredNavigation = $derived.by(() => {
    if (selectedAudiences.size === 0) {
      return navigation; // Show all if no filters selected
    }

    return navigation
      .map((section) => ({
        ...section,
        links: section.links.filter(
          (link) => !link.audience || selectedAudiences.has(link.audience as AudienceType)
        ),
      }))
      .filter((section) => section.links.length > 0); // Remove empty sections
  });

  // Search functionality
  $effect(() => {
    if (searchQuery.trim() === '') {
      searchResults = [];
      return;
    }

    const query = searchQuery.toLowerCase();
    searchResults = allLinks.filter(
      (link) =>
        link.title.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query) ||
        link.section.toLowerCase().includes(query)
    );
  });

  function toggleSection(sectionTitle: string) {
    expandedSections[sectionTitle] = !isSectionExpanded(sectionTitle);
  }

  function isSectionExpanded(sectionTitle: string): boolean {
    return expandedSections[sectionTitle] ?? true;
  }

  function clearSearch() {
    searchQuery = '';
  }

  function toggleAudience(audience: AudienceType) {
    const newSet = new SvelteSet(selectedAudiences);
    if (newSet.has(audience)) {
      newSet.delete(audience);
    } else {
      newSet.add(audience);
    }
    selectedAudiences = newSet;
  }

  function clearFilters() {
    selectedAudiences = new SvelteSet();
  }

  // Check if link is active
  function isActive(href: string): boolean {
    return currentPath === href || $page.url.pathname === href;
  }
</script>

<aside class="docs-sidebar">
  <!-- Search -->
  <div class="docs-sidebar__search">
    <div class="docs-sidebar__search-wrapper">
      <Search size={16} class="docs-sidebar__search-icon" aria-hidden="true" />
      <label for="sidebar-search-input" class="visually-hidden">Search documentation</label>
      <input
        id="sidebar-search-input"
        type="text"
        placeholder="Search docs..."
        bind:value={searchQuery}
        class="docs-sidebar__search-input"
      />
      {#if searchQuery}
        <button
          onclick={clearSearch}
          class="docs-sidebar__search-clear"
          type="button"
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      {/if}
    </div>

    <!-- Search Results -->
    {#if searchQuery && searchResults.length > 0}
      <div
        class="docs-sidebar__search-results"
        role="region"
        aria-live="polite"
        aria-label="Search results"
      >
        {#each searchResults as result (result.href)}
          <a href={result.href} class="docs-sidebar__search-item">
            <div class="docs-sidebar__search-section">{result.section}</div>
            <div class="docs-sidebar__search-title">{result.title}</div>
            <div class="docs-sidebar__search-description">{result.description}</div>
          </a>
        {/each}
      </div>
    {:else if searchQuery && searchResults.length === 0}
      <div class="docs-sidebar__search-empty" role="status" aria-live="polite">
        <p>No results for "{searchQuery}"</p>
      </div>
    {/if}
  </div>

  <!-- Navigation (hidden when searching) -->
  {#if !searchQuery}
    <nav class="docs-sidebar__nav" aria-label="Documentation navigation">
      {#each filteredNavigation as section (section.title)}
        <div class="docs-sidebar__section">
          <button
            class="docs-sidebar__section-header"
            onclick={() => toggleSection(section.title)}
            type="button"
            aria-expanded={isSectionExpanded(section.title)}
            aria-controls="section-{section.title.toLowerCase().replace(/\s+/g, '-')}"
            aria-label="{isSectionExpanded(section.title)
              ? 'Collapse'
              : 'Expand'} {section.title} section"
          >
            <div class="docs-sidebar__section-title">
              {#if section.icon}
                <section.icon size={16} aria-hidden="true" />
              {:else}
                <BookOpen size={16} aria-hidden="true" />
              {/if}
              <span>{section.title}</span>
            </div>
            <span
              class="docs-sidebar__section-chevron"
              class:expanded={isSectionExpanded(section.title)}
            >
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </button>

          <div
            class="docs-sidebar__links"
            id="section-{section.title.toLowerCase().replace(/\s+/g, '-')}"
            hidden={!isSectionExpanded(section.title)}
          >
            {#each section.links as link (link.href)}
              <a
                href={link.href}
                class="docs-sidebar__link {isActive(link.href) ? 'active' : ''}"
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                <span>{link.title}</span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </nav>
  {/if}

  <!-- Audience Filter at bottom (hidden when searching) -->
  {#if !searchQuery}
    <div class="docs-sidebar__filter">
      {#each AUDIENCE_TYPES as audience (audience)}
        <button
          onclick={() => toggleAudience(audience)}
          class="docs-sidebar__filter-pill {selectedAudiences.has(audience) ? 'active' : ''}"
          type="button"
          aria-pressed={selectedAudiences.has(audience)}
          title={AUDIENCE_LABELS[audience]}
        >
          {AUDIENCE_LABELS[audience]}
        </button>
      {/each}
      {#if selectedAudiences.size > 0}
        <button onclick={clearFilters} class="docs-sidebar__filter-reset" type="button">
          clear
        </button>
      {/if}
    </div>
  {/if}
</aside>

<style lang="scss">
  @mixin focus-ring {
    &:focus-visible {
      outline: 2px solid var(--color-text-accent);
      outline-offset: 2px;
    }
  }

  /* Visually hidden but accessible to screen readers */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .docs-sidebar {
    width: var(--docs-sidebar-width, 280px);
    height: 100%;
    background: var(--color-background);
    border-right: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  /* Search */
  .docs-sidebar__search {
    padding: var(--space-6);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .docs-sidebar__search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .docs-sidebar__search-wrapper :global(.docs-sidebar__search-icon) {
    position: absolute;
    left: var(--space-2);
    color: var(--color-text-tertiary);
    pointer-events: none;
  }

  .docs-sidebar__search-input {
    @include focus-ring;

    width: 100%;
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-12);
    background: var(--color-surface);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-xl);
    color: var(--color-text-primary);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    transition: all var(--duration-fast) var(--ease-out);

    &:focus {
      border-color: var(--color-text-accent);
      background: var(--color-surface-raised);
    }

    &::placeholder {
      color: var(--color-text-tertiary);
    }
  }

  .docs-sidebar__search-clear {
    @include focus-ring;

    position: absolute;
    right: var(--space-1);
    padding: var(--space-1);
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--color-surface-overlay);
      color: var(--color-text-primary);
    }
  }

  /* Search Results */
  .docs-sidebar__search-results {
    margin-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-height: 400px;
    overflow-y: auto;
  }

  .docs-sidebar__search-item {
    @include focus-ring;

    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    transition: all var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--color-surface-overlay);
      border-color: var(--color-text-accent);
      transform: translateX(var(--space-1));
    }
  }

  .docs-sidebar__search-section {
    font-size: var(--font-size-xs);
    color: var(--color-text-accent);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .docs-sidebar__search-title {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .docs-sidebar__search-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .docs-sidebar__search-empty {
    margin-top: var(--space-4);
    padding: var(--space-4);
    text-align: center;

    p {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }
  }

  /* Navigation */
  .docs-sidebar__nav {
    flex: 1;
    padding: var(--space-4) 0;
    overflow-y: auto;
  }

  .docs-sidebar__section {
    margin-bottom: var(--space-2);
  }

  .docs-sidebar__section-header {
    @include focus-ring;

    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--color-surface-overlay);
    }
  }

  .docs-sidebar__section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);

    :global(svg) {
      color: var(--color-text-accent);
    }
  }

  .docs-sidebar__section-chevron {
    color: white !important;
    opacity: 0.5;
    transition: transform var(--duration-fast) var(--ease-out);
  }

  .docs-sidebar__section-chevron.expanded {
    transform: rotate(180deg);
  }

  .docs-sidebar__links {
    display: flex;
    flex-direction: column;
  }

  .docs-sidebar__link {
    @include focus-ring;

    /* Align with section title text: section padding + icon (16px) + gap */
    padding: var(--space-2) var(--space-4) var(--space-2)
      calc(var(--space-2) + 16px + var(--space-2));
    text-decoration: none;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    transition: all var(--duration-fast) var(--ease-out);
    border-left: 2px solid transparent;

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-overlay);
      border-left-color: var(--color-text-accent);
    }

    &.active {
      color: var(--color-text-accent);
      background: var(--color-surface);
      border-left-color: var(--color-text-accent);
      font-weight: var(--font-weight-semibold);
    }
  }

  /* Scrollbar styling */
  .docs-sidebar,
  .docs-sidebar__search-results,
  .docs-sidebar__nav {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-medium) transparent;
  }

  .docs-sidebar::-webkit-scrollbar,
  .docs-sidebar__search-results::-webkit-scrollbar,
  .docs-sidebar__nav::-webkit-scrollbar {
    width: 6px;
  }

  .docs-sidebar::-webkit-scrollbar-track,
  .docs-sidebar__search-results::-webkit-scrollbar-track,
  .docs-sidebar__nav::-webkit-scrollbar-track {
    background: transparent;
  }

  .docs-sidebar::-webkit-scrollbar-thumb,
  .docs-sidebar__search-results::-webkit-scrollbar-thumb,
  .docs-sidebar__nav::-webkit-scrollbar-thumb {
    background: var(--color-border-medium);
    border-radius: 3px;
  }

  .docs-sidebar::-webkit-scrollbar-thumb:hover,
  .docs-sidebar__search-results::-webkit-scrollbar-thumb:hover,
  .docs-sidebar__nav::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-strong);
  }

  /* Audience Filter - Minimal Apple aesthetic */
  .docs-sidebar__filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .docs-sidebar__filter-pill {
    @include focus-ring;

    padding: 4px 10px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.7);
    }

    &.active {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
    }
  }

  .docs-sidebar__filter-reset {
    @include focus-ring;

    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.35);
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-left: auto;

    &:hover {
      color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.03);
    }
  }
</style>
