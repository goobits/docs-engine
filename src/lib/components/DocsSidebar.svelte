<script lang="ts">
  /**
   * V2 Docs Sidebar
   *
   * Integrated sidebar matching v2 design system
   */

  import { page } from '$app/stores';
  import { Search, ChevronDown, X } from '@lucide/svelte';
  import { getAllDocsLinks, type DocsLink } from '$lib/config/docs-navigation';
  import { SvelteSet } from 'svelte/reactivity';
  import type { DocsSection } from './types';

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
  let searchResults = $state<Array<DocsLink & { section: string }>>([]);

  // Expanded sections state - initialize all sections as open by default (SSR-safe)
  let expandedSections = $state<Record<string, boolean>>(
    Object.fromEntries(navigation.map((section) => [section.title, true]))
  );

  // All links for search
  const allLinks = getAllDocsLinks();

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
        const defaultSections = Object.fromEntries(
          navigation.map((section) => [section.title, true])
        );
        const merged = { ...defaultSections };
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
    expandedSections[sectionTitle] = !expandedSections[sectionTitle];
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

<aside class="v2-docs-sidebar">
  <!-- Search -->
  <div class="v2-docs-sidebar__search">
    <div class="v2-docs-sidebar__search-wrapper">
      <Search size={16} class="v2-docs-sidebar__search-icon" />
      <input
        type="text"
        placeholder="Search docs..."
        bind:value={searchQuery}
        class="v2-docs-sidebar__search-input"
      />
      {#if searchQuery}
        <button
          onclick={clearSearch}
          class="v2-docs-sidebar__search-clear"
          type="button"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    <!-- Search Results -->
    {#if searchQuery && searchResults.length > 0}
      <div class="v2-docs-sidebar__search-results">
        {#each searchResults as result (result.href)}
          <a href={result.href} class="v2-docs-sidebar__search-item">
            <div class="v2-docs-sidebar__search-section">{result.section}</div>
            <div class="v2-docs-sidebar__search-title">{result.title}</div>
            <div class="v2-docs-sidebar__search-description">{result.description}</div>
          </a>
        {/each}
      </div>
    {:else if searchQuery && searchResults.length === 0}
      <div class="v2-docs-sidebar__search-empty">
        <p>No results for "{searchQuery}"</p>
      </div>
    {/if}
  </div>

  <!-- Navigation (hidden when searching) -->
  {#if !searchQuery}
    <nav class="v2-docs-sidebar__nav">
      {#each filteredNavigation as section (section.title)}
        <div class="v2-docs-sidebar__section">
          <button
            class="v2-docs-sidebar__section-header"
            onclick={() => toggleSection(section.title)}
            type="button"
          >
            <div class="v2-docs-sidebar__section-title">
              <svelte:component this={section.icon} size={16} />
              <span>{section.title}</span>
            </div>
            <ChevronDown
              size={14}
              class="v2-docs-sidebar__section-chevron {expandedSections[section.title]
                ? 'expanded'
                : ''}"
            />
          </button>

          {#if expandedSections[section.title]}
            <div class="v2-docs-sidebar__links">
              {#each section.links as link (link.href)}
                <a
                  href={link.href}
                  class="v2-docs-sidebar__link {isActive(link.href) ? 'active' : ''}"
                >
                  <span>{link.title}</span>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </nav>
  {/if}

  <!-- Audience Filter at bottom (hidden when searching) -->
  {#if !searchQuery}
    <div class="v2-docs-sidebar__filter">
      {#each AUDIENCE_TYPES as audience (audience)}
        <button
          onclick={() => toggleAudience(audience)}
          class="v2-docs-sidebar__filter-pill {selectedAudiences.has(audience) ? 'active' : ''}"
          type="button"
          aria-pressed={selectedAudiences.has(audience)}
          title={AUDIENCE_LABELS[audience]}
        >
          {AUDIENCE_LABELS[audience]}
        </button>
      {/each}
      {#if selectedAudiences.size > 0}
        <button onclick={clearFilters} class="v2-docs-sidebar__filter-reset" type="button">
          clear
        </button>
      {/if}
    </div>
  {/if}
</aside>

<style lang="scss">
  @use '$lib/styles/v2-tokens.scss' as *;

  .v2-docs-sidebar {
    width: 280px;
    height: 100%;
    background: var(--v2-surface-base);
    border-right: 1px solid var(--v2-border-subtle);
    border-radius: var(--v2-radius-lg);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  /* Search */
  .v2-docs-sidebar__search {
    padding: var(--v2-spacing-lg);
    border-bottom: 1px solid var(--v2-border-subtle);
  }

  .v2-docs-sidebar__search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .v2-docs-sidebar__search-wrapper :global(.v2-docs-sidebar__search-icon) {
    position: absolute;
    left: var(--v2-spacing-sm);
    color: var(--v2-text-tertiary);
    pointer-events: none;
  }

  .v2-docs-sidebar__search-input {
    @include v2-focus-ring;

    width: 100%;
    padding: var(--v2-spacing-sm) var(--v2-spacing-sm) var(--v2-spacing-sm) var(--v2-spacing-2xl);
    background: var(--v2-surface-interactive);
    border: 1px solid var(--v2-border-medium);
    border-radius: var(--v2-radius-md);
    color: var(--v2-text-primary);
    font-family: var(--v2-font-mono);
    font-size: var(--v2-font-size-sm);
    transition: all var(--v2-duration-fast) var(--v2-ease-out);

    &:focus {
      border-color: var(--v2-text-accent);
      background: var(--v2-surface-raised);
    }

    &::placeholder {
      color: var(--v2-text-tertiary);
    }
  }

  .v2-docs-sidebar__search-clear {
    @include v2-focus-ring;

    position: absolute;
    right: var(--v2-spacing-xs);
    padding: var(--v2-spacing-xs);
    background: transparent;
    border: none;
    color: var(--v2-text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--v2-radius-sm);
    transition: all var(--v2-duration-fast) var(--v2-ease-out);

    &:hover {
      background: var(--v2-surface-interactive-hover);
      color: var(--v2-text-primary);
    }
  }

  /* Search Results */
  .v2-docs-sidebar__search-results {
    margin-top: var(--v2-spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-sm);
    max-height: 400px;
    overflow-y: auto;
  }

  .v2-docs-sidebar__search-item {
    @include v2-focus-ring;

    padding: var(--v2-spacing-md);
    background: var(--v2-surface-interactive);
    border: 1px solid var(--v2-border-subtle);
    border-radius: var(--v2-radius-md);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-xs);
    transition: all var(--v2-duration-fast) var(--v2-ease-out);

    &:hover {
      background: var(--v2-surface-interactive-hover);
      border-color: var(--v2-text-accent);
      transform: translateX(var(--v2-spacing-xs));
    }
  }

  .v2-docs-sidebar__search-section {
    font-size: var(--v2-font-size-xs);
    color: var(--v2-text-accent);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .v2-docs-sidebar__search-title {
    font-size: var(--v2-font-size-sm);
    color: var(--v2-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .v2-docs-sidebar__search-description {
    font-size: var(--v2-font-size-xs);
    color: var(--v2-text-secondary);
    line-height: 1.5;
  }

  .v2-docs-sidebar__search-empty {
    margin-top: var(--v2-spacing-md);
    padding: var(--v2-spacing-md);
    text-align: center;

    p {
      font-size: var(--v2-font-size-sm);
      color: var(--v2-text-secondary);
      margin: 0;
    }
  }

  /* Navigation */
  .v2-docs-sidebar__nav {
    flex: 1;
    padding: var(--v2-spacing-md) 0;
    overflow-y: auto;
  }

  .v2-docs-sidebar__section {
    margin-bottom: var(--v2-spacing-sm);
  }

  .v2-docs-sidebar__section-header {
    @include v2-focus-ring;

    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--v2-spacing-sm) var(--v2-spacing-md) var(--v2-spacing-sm) var(--v2-spacing-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--v2-duration-fast) var(--v2-ease-out);

    &:hover {
      background: var(--v2-surface-interactive-hover);
    }
  }

  .v2-docs-sidebar__section-title {
    display: flex;
    align-items: center;
    gap: var(--v2-spacing-sm);
    font-size: var(--v2-font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--v2-text-primary);

    :global(svg) {
      color: var(--v2-text-accent);
    }
  }

  :global(.v2-docs-sidebar__section-chevron) {
    color: white !important;
    opacity: 0.5;
    transition: transform var(--v2-duration-fast) var(--v2-ease-out);

    &.expanded {
      transform: rotate(180deg);
    }
  }

  .v2-docs-sidebar__links {
    display: flex;
    flex-direction: column;
  }

  .v2-docs-sidebar__link {
    @include v2-focus-ring;

    /* Align with section title text: section padding + icon (16px) + gap */
    padding: var(--v2-spacing-sm) var(--v2-spacing-md) var(--v2-spacing-sm)
      calc(var(--v2-spacing-sm) + 16px + var(--v2-spacing-sm));
    text-decoration: none;
    color: var(--v2-text-secondary);
    font-size: var(--v2-font-size-sm);
    transition: all var(--v2-duration-fast) var(--v2-ease-out);
    border-left: 2px solid transparent;

    &:hover {
      color: var(--v2-text-primary);
      background: var(--v2-surface-interactive-hover);
      border-left-color: var(--v2-text-accent);
    }

    &.active {
      color: var(--v2-text-accent);
      background: var(--v2-surface-interactive);
      border-left-color: var(--v2-text-accent);
      font-weight: var(--font-weight-semibold);
    }
  }

  /* Scrollbar styling */
  .v2-docs-sidebar,
  .v2-docs-sidebar__search-results,
  .v2-docs-sidebar__nav {
    scrollbar-width: thin;
    scrollbar-color: var(--v2-border-medium) transparent;
  }

  .v2-docs-sidebar::-webkit-scrollbar,
  .v2-docs-sidebar__search-results::-webkit-scrollbar,
  .v2-docs-sidebar__nav::-webkit-scrollbar {
    width: 6px;
  }

  .v2-docs-sidebar::-webkit-scrollbar-track,
  .v2-docs-sidebar__search-results::-webkit-scrollbar-track,
  .v2-docs-sidebar__nav::-webkit-scrollbar-track {
    background: transparent;
  }

  .v2-docs-sidebar::-webkit-scrollbar-thumb,
  .v2-docs-sidebar__search-results::-webkit-scrollbar-thumb,
  .v2-docs-sidebar__nav::-webkit-scrollbar-thumb {
    background: var(--v2-border-medium);
    border-radius: 3px;
  }

  .v2-docs-sidebar::-webkit-scrollbar-thumb:hover,
  .v2-docs-sidebar__search-results::-webkit-scrollbar-thumb:hover,
  .v2-docs-sidebar__nav::-webkit-scrollbar-thumb:hover {
    background: var(--v2-border-strong);
  }

  /* Audience Filter - Minimal Apple aesthetic */
  .v2-docs-sidebar__filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .v2-docs-sidebar__filter-pill {
    @include v2-focus-ring;

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

  .v2-docs-sidebar__filter-reset {
    @include v2-focus-ring;

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
