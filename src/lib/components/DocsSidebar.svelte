<script lang="ts">
  /**
   * Docs Sidebar
   *
   * Integrated sidebar matching the docs design system
   */

  import { page } from '$app/stores';
  import { ChevronDown, Command, Search } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import {
    DOCS_AUDIENCES,
    isDocsAudience,
    type DocsAudience,
    type DocsSection,
  } from '../utils/navigation';
  import { resolveDocsSectionIcon } from './section-icons.ts';

  // Audience filter state
  const AUDIENCE_LABELS: Record<DocsAudience, string> = {
    'new-users': 'New Users',
    developers: 'Developers',
    operators: 'Operators',
    integrators: 'Integrators',
    contributors: 'Contributors',
  };

  interface Props {
    navigation: DocsSection[];
    currentPath?: string;
    selectedAudiences?: SvelteSet<DocsAudience>;
    /** Opens the full-text search modal. Omitted when no search index exists. */
    onSearch?: () => void;
  }

  let {
    navigation,
    currentPath = '',
    selectedAudiences = $bindable(new SvelteSet<DocsAudience>(['new-users', 'developers'])),
    onSearch,
  }: Props = $props();

  /** Sections longer than this stay collapsed unless they hold the current page. */
  const largeSectionLinkCount = 12;

  const defaultExpandedSections = $derived.by<Record<string, boolean>>(() =>
    Object.fromEntries(
      navigation.map((section) => [
        section.title,
        section.links.length <= largeSectionLinkCount ||
          section.links.some((link) => isActive(link.href)),
      ])
    )
  );
  let expandedSections = $state<Record<string, boolean>>({});

  // Track if we've loaded from localStorage (prevents infinite loops)
  let hasLoadedFromStorage = $state(false);

  // Load from localStorage on client (runs once on mount)
  $effect(() => {
    if (typeof window === 'undefined' || hasLoadedFromStorage) return;

    // Load audience filter
    const storedAudiences = localStorage.getItem('docs-audience-filter');
    if (storedAudiences) {
      try {
        const parsed: unknown = JSON.parse(storedAudiences);
        if (Array.isArray(parsed)) {
          selectedAudiences = new SvelteSet(parsed.filter(isDocsAudience));
        }
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
          (link) => !link.audience || selectedAudiences.has(link.audience)
        ),
      }))
      .filter((section) => section.links.length > 0); // Remove empty sections
  });

  function toggleSection(sectionTitle: string) {
    expandedSections[sectionTitle] = !isSectionExpanded(sectionTitle);
  }

  function isSectionExpanded(sectionTitle: string): boolean {
    return expandedSections[sectionTitle] ?? defaultExpandedSections[sectionTitle] ?? true;
  }

  function toggleAudience(audience: DocsAudience) {
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
  <!-- Search: opens the full-text modal, which also answers Cmd+K -->
  {#if onSearch}
    <div class="docs-sidebar__search">
      <button onclick={onSearch} class="docs-sidebar__search-button" type="button">
        <Search size={16} aria-hidden="true" />
        <span class="docs-sidebar__search-label">Search docs</span>
        <kbd class="docs-sidebar__search-kbd">
          <Command size={12} aria-hidden="true" />
          <span>K</span>
        </kbd>
      </button>
    </div>
  {/if}

  <nav class="docs-sidebar__nav" aria-label="Documentation navigation">
    {#each filteredNavigation as section (section.title)}
      {@const SectionIcon = resolveDocsSectionIcon(section.iconName)}
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
            <SectionIcon size={16} aria-hidden="true" />
            <span>{section.title}</span>
          </div>
          <span
            class="docs-sidebar__section-chevron"
            class:expanded={isSectionExpanded(section.title)}
          >
            <ChevronDown size={16} aria-hidden="true" />
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

  <div class="docs-sidebar__filter">
    {#each DOCS_AUDIENCES as audience (audience)}
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
</aside>

<style lang="scss">
  @mixin focus-ring {
    &:focus-visible {
      outline: 2px solid var(--color-text-accent);
      outline-offset: 2px;
    }
  }

  .docs-sidebar {
    width: var(--docs-sidebar-width, 280px);
    height: 100%;
    background: var(--color-background);
    border-right: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Search */
  .docs-sidebar__search {
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .docs-sidebar__search-button {
    @include focus-ring;

    width: 100%;
    min-height: 32px;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-2);
    background: var(--color-surface);
    border: 1px solid var(--color-border-medium);
    border-radius: var(--radius-lg);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--color-surface-raised);
      border-color: var(--color-text-accent);
      color: var(--color-text-secondary);
    }
  }

  .docs-sidebar__search-label {
    flex: 1;
    text-align: left;
  }

  .docs-sidebar__search-kbd {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 1px var(--space-1);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xs);
  }

  /* Navigation */
  .docs-sidebar__nav {
    flex: 1;
    min-height: 0;
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
    color: var(--color-text-tertiary);
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
  .docs-sidebar__nav {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-medium) transparent;
  }

  .docs-sidebar__nav::-webkit-scrollbar {
    width: 6px;
  }

  .docs-sidebar__nav::-webkit-scrollbar-track {
    background: transparent;
  }

  .docs-sidebar__nav::-webkit-scrollbar-thumb {
    background: var(--color-border-medium);
    border-radius: 3px;
  }

  .docs-sidebar__nav::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-strong);
  }

  /* Audience Filter */
  .docs-sidebar__filter {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-top: 1px solid var(--color-border-subtle);
  }

  .docs-sidebar__filter-pill {
    @include focus-ring;

    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    letter-spacing: -0.01em;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);

    &:hover {
      background: var(--color-surface-overlay);
      color: var(--color-text-primary);
    }

    &.active {
      background: var(--color-surface-raised);
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
    }
  }

  .docs-sidebar__filter-reset {
    @include focus-ring;

    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-out);
    margin-left: auto;

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface);
    }
  }
</style>
