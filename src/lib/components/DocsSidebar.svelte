<script lang="ts">
  /**
   * V2 Docs Sidebar
   *
   * Integrated sidebar matching v2 design system
   * Extracted from Spacebase for @goobits/markdown-docs
   */

  import { Search, ChevronDown, X } from "@lucide/svelte";
  import type { DocsSection, DocsLink } from './types.js';

  interface Props {
    navigation: DocsSection[];
    currentPath?: string;
  }

  let { navigation, currentPath = "" }: Props = $props();

  // Search state
  let searchQuery = $state("");
  let searchResults = $state<Array<DocsLink & { section: string }>>([]);

  // Expanded sections state
  let expandedSections = $state<Record<string, boolean>>({});

  // Initialize all sections as expanded
  $effect(() => {
    const sections: Record<string, boolean> = {};
    navigation.forEach(section => {
      sections[section.title] = true;
    });
    expandedSections = sections;
  });

  // Flatten navigation for search
  const allLinks = $derived(navigation.flatMap((section) =>
    section.links.map((link) => ({
      ...link,
      section: section.title,
    }))
  ));

  // Search functionality
  $effect(() => {
    if (searchQuery.trim() === "") {
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
    searchQuery = "";
  }

  // Check if link is active
  function isActive(href: string): boolean {
    if (typeof window === 'undefined') return false;
    return currentPath === href || window.location.pathname === href;
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
      {#each navigation as section (section.title)}
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
</aside>

<style lang="scss">
  .v2-docs-sidebar {
    width: 280px;
    height: 100%;
    background: var(--v2-surface-base, rgba(255, 255, 255, 0.03));
    border-right: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: var(--v2-radius-lg, 14px);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  /* Search */
  .v2-docs-sidebar__search {
    padding: var(--v2-spacing-lg, 1.5rem);
    border-bottom: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .v2-docs-sidebar__search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .v2-docs-sidebar__search-wrapper :global(.v2-docs-sidebar__search-icon) {
    position: absolute;
    left: var(--v2-spacing-sm, 0.5rem);
    color: var(--v2-text-tertiary, rgba(255, 255, 255, 0.5));
    pointer-events: none;
  }

  .v2-docs-sidebar__search-input {
    width: 100%;
    padding: var(--v2-spacing-sm, 0.5rem) var(--v2-spacing-sm, 0.5rem) var(--v2-spacing-sm, 0.5rem) var(--v2-spacing-2xl, 3rem);
    background: var(--v2-surface-interactive, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--v2-border-medium, rgba(255, 255, 255, 0.12));
    border-radius: var(--v2-radius-md, 10px);
    color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
    font-family: var(--v2-font-mono, monospace);
    font-size: var(--v2-font-size-sm, 0.875rem);
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    outline: none;

    &:focus {
      border-color: var(--v2-text-accent, rgb(0, 122, 255));
      background: var(--v2-surface-raised, rgba(255, 255, 255, 0.06));
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }

    &::placeholder {
      color: var(--v2-text-tertiary, rgba(255, 255, 255, 0.5));
    }
  }

  .v2-docs-sidebar__search-clear {
    position: absolute;
    right: var(--v2-spacing-xs, 0.25rem);
    padding: var(--v2-spacing-xs, 0.25rem);
    background: transparent;
    border: none;
    color: var(--v2-text-tertiary, rgba(255, 255, 255, 0.5));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--v2-radius-sm, 6px);
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    outline: none;

    &:hover {
      background: var(--v2-surface-interactive-hover, rgba(255, 255, 255, 0.08));
      color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }
  }

  /* Search Results */
  .v2-docs-sidebar__search-results {
    margin-top: var(--v2-spacing-md, 1rem);
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-sm, 0.5rem);
    max-height: 400px;
    overflow-y: auto;
  }

  .v2-docs-sidebar__search-item {
    padding: var(--v2-spacing-md, 1rem);
    background: var(--v2-surface-interactive, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: var(--v2-radius-md, 10px);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-xs, 0.25rem);
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    outline: none;

    &:hover {
      background: var(--v2-surface-interactive-hover, rgba(255, 255, 255, 0.08));
      border-color: var(--v2-text-accent, rgb(0, 122, 255));
      transform: translateX(var(--v2-spacing-xs, 0.25rem));
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }
  }

  .v2-docs-sidebar__search-section {
    font-size: var(--v2-font-size-xs, 0.75rem);
    color: var(--v2-text-accent, rgb(0, 122, 255));
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .v2-docs-sidebar__search-title {
    font-size: var(--v2-font-size-sm, 0.875rem);
    color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
    font-weight: 600;
  }

  .v2-docs-sidebar__search-description {
    font-size: var(--v2-font-size-xs, 0.75rem);
    color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
    line-height: 1.5;
  }

  .v2-docs-sidebar__search-empty {
    margin-top: var(--v2-spacing-md, 1rem);
    padding: var(--v2-spacing-md, 1rem);
    text-align: center;

    p {
      font-size: var(--v2-font-size-sm, 0.875rem);
      color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
      margin: 0;
    }
  }

  /* Navigation */
  .v2-docs-sidebar__nav {
    flex: 1;
    padding: var(--v2-spacing-md, 1rem) 0;
    overflow-y: auto;
  }

  .v2-docs-sidebar__section {
    margin-bottom: var(--v2-spacing-sm, 0.5rem);
  }

  .v2-docs-sidebar__section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--v2-spacing-sm, 0.5rem) var(--v2-spacing-lg, 1.5rem);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    outline: none;

    &:hover {
      background: var(--v2-surface-interactive-hover, rgba(255, 255, 255, 0.08));
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }
  }

  .v2-docs-sidebar__section-title {
    display: flex;
    align-items: center;
    gap: var(--v2-spacing-sm, 0.5rem);
    font-size: var(--v2-font-size-sm, 0.875rem);
    font-weight: 600;
    color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));

    :global(svg) {
      color: var(--v2-text-accent, rgb(0, 122, 255));
    }
  }

  :global(.v2-docs-sidebar__section-chevron) {
    color: white !important;
    opacity: 0.5;
    transition: transform var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));

    &.expanded {
      transform: rotate(180deg);
    }
  }

  .v2-docs-sidebar__links {
    display: flex;
    flex-direction: column;
    padding-left: var(--v2-spacing-lg, 1.5rem);
  }

  .v2-docs-sidebar__link {
    padding: var(--v2-spacing-sm, 0.5rem) var(--v2-spacing-lg, 1.5rem);
    text-decoration: none;
    color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
    font-size: var(--v2-font-size-sm, 0.875rem);
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    border-left: 2px solid transparent;
    margin-left: var(--v2-spacing-md, 1rem);
    outline: none;

    &:hover {
      color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
      background: var(--v2-surface-interactive-hover, rgba(255, 255, 255, 0.08));
      border-left-color: var(--v2-text-accent, rgb(0, 122, 255));
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }

    &.active {
      color: var(--v2-text-accent, rgb(0, 122, 255));
      background: var(--v2-surface-interactive, rgba(255, 255, 255, 0.05));
      border-left-color: var(--v2-text-accent, rgb(0, 122, 255));
      font-weight: 600;
    }
  }

  /* Scrollbar styling */
  .v2-docs-sidebar,
  .v2-docs-sidebar__search-results,
  .v2-docs-sidebar__nav {
    scrollbar-width: thin;
    scrollbar-color: var(--v2-border-medium, rgba(255, 255, 255, 0.12)) transparent;
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
    background: var(--v2-border-medium, rgba(255, 255, 255, 0.12));
    border-radius: 3px;
  }

  .v2-docs-sidebar::-webkit-scrollbar-thumb:hover,
  .v2-docs-sidebar__search-results::-webkit-scrollbar-thumb:hover,
  .v2-docs-sidebar__nav::-webkit-scrollbar-thumb:hover {
    background: var(--v2-border-strong, rgba(255, 255, 255, 0.24));
  }
</style>
