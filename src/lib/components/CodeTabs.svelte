<script lang="ts">
  import { onMount } from 'svelte';
  import { decodeBase64 } from '@goobits/docs-engine/utils';
  import { highlightCode } from '@goobits/docs-engine/utils';

  interface Tab {
    label: string;
    content: string;
    language?: string;
  }

  interface Props {
    /** Base64-encoded tabs data */
    tabs: string;
    /** Tabs ID for URL hash support */
    tabsId: string;
    /** Theme for syntax highlighting */
    theme?: string;
  }

  let { tabs: encodedTabs, tabsId, theme = 'dracula' }: Props = $props();

  let tabs = $state<Tab[]>([]);
  let activeIndex = $state(0);
  let highlightedCode = $state<string[]>([]);
  let loaded = $state(false);

  // Parse tabs from base64 (environment-safe)
  try {
    const decoded = decodeBase64(encodedTabs);
    tabs = JSON.parse(decoded);
  } catch (err) {
    console.error('Failed to parse tabs data:', err);
  }

  // Handle keyboard navigation
  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      activeIndex = index - 1;
      updateHash();
    } else if (event.key === 'ArrowRight' && index < tabs.length - 1) {
      event.preventDefault();
      activeIndex = index + 1;
      updateHash();
    }
  }

  // Update URL hash
  function updateHash() {
    const tabLabel = tabs[activeIndex].label.toLowerCase().replace(/\s+/g, '-');
    window.history.replaceState(null, '', `#${tabsId}-${tabLabel}`);
  }

  // Set active tab by index
  function setActiveTab(index: number) {
    activeIndex = index;
    updateHash();
  }

  // Copy code to clipboard
  async function copyCode(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }

  onMount(async () => {
    // Check for hash in URL
    const hash = window.location.hash.substring(1);
    if (hash.startsWith(`${tabsId}-`)) {
      const tabLabel = hash.replace(`${tabsId}-`, '').replace(/-/g, ' ');
      const index = tabs.findIndex((t) => t.label.toLowerCase() === tabLabel);
      if (index !== -1) {
        activeIndex = index;
      }
    }

    // Highlight all code blocks using shared highlighter
    highlightedCode = await Promise.all(
      tabs.map(async (tab) => {
        if (!tab.language) {
          // Non-code content - treat as HTML (may contain Screenshot divs, markdown, etc.)
          return tab.content;
        }

        return await highlightCode(tab.content, tab.language, theme);
      })
    );

    loaded = true;
  });

  // eslint-disable-next-line no-unused-vars
  function _escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }
</script>

<div class="md-code-tabs">
  <div class="md-code-tabs__header" role="tablist">
    <div class="md-code-tabs__tabs">
      {#each tabs as tab, index}
        <button
          class="md-code-tabs__tab"
          class:md-code-tabs__tab--active={activeIndex === index}
          role="tab"
          aria-selected={activeIndex === index}
          aria-controls={`${tabsId}-panel-${index}`}
          id={`${tabsId}-tab-${index}`}
          tabindex={activeIndex === index ? 0 : -1}
          onclick={() => setActiveTab(index)}
          onkeydown={(e) => handleKeyDown(e, index)}
        >
          <span class="md-code-tabs__tab-label">{tab.label}</span>
          {#if tab.language}
            <span class="md-code-tabs__tab-lang">{tab.language}</span>
          {/if}
        </button>
      {/each}
    </div>
    <button
      class="md-code-tabs__copy-btn"
      onclick={() => copyCode(tabs[activeIndex].content)}
      title="Copy code"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.5 2.5h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <path
          d="M3.5 5.5h-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
      Copy
    </button>
  </div>

  <div class="md-code-tabs__content">
    {#each tabs as tab, index}
      <div
        class="md-code-tabs__panel"
        class:md-code-tabs__panel--active={activeIndex === index}
        role="tabpanel"
        id={`${tabsId}-panel-${index}`}
        aria-labelledby={`${tabsId}-tab-${index}`}
        hidden={activeIndex !== index}
      >
        {#if loaded && highlightedCode[index]}
          <div class="md-code-tabs__code">
            {@html highlightedCode[index]}
          </div>
        {:else}
          <pre class="md-code-tabs__loading"><code>{tab.content}</code></pre>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .md-code-tabs {
    margin: var(--md-spacing-xl, 2rem) 0;
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-medium, rgba(255, 255, 255, 0.1));
    border-radius: var(--md-radius-lg, 14px);
    overflow: hidden;
  }

  .md-code-tabs__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--md-spacing-md, 1rem);
    padding: var(--md-spacing-sm, 0.5rem);
    padding-top: calc(var(--md-spacing-sm, 0.5rem) + 2px);
    background: var(--md-surface-raised, rgba(255, 255, 255, 0.05));
    border-bottom: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: thin;
  }

  .md-code-tabs__tabs {
    display: flex;
    gap: var(--md-spacing-xs, 0.25rem);
    flex: 1;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .md-code-tabs__header::-webkit-scrollbar {
    height: 6px;
  }

  .md-code-tabs__header::-webkit-scrollbar-track {
    background: transparent;
  }

  .md-code-tabs__header::-webkit-scrollbar-thumb {
    background: var(--md-border-medium, rgba(255, 255, 255, 0.1));
    border-radius: 3px;
  }

  .md-code-tabs__tab {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-xs, 0.25rem);
    padding: var(--md-spacing-sm, 0.5rem) var(--md-spacing-lg, 1.5rem);
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: var(--md-radius-md, 10px);
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.8));
    cursor: pointer;
    transition: all var(--md-duration-fast, 0.15s);
    white-space: nowrap;
    font-size: var(--md-font-size-sm, 0.875rem);
    font-family: var(
      --md-font-sans,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      sans-serif
    );
  }

  .md-code-tabs__tab:hover {
    background: var(--md-surface-raised, rgba(255, 255, 255, 0.08));
    border-color: var(--md-border-medium, rgba(255, 255, 255, 0.2));
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
    transform: translateY(-1px);
  }

  .md-code-tabs__tab:focus {
    outline: 2px solid var(--md-text-accent, rgb(0, 122, 255));
    outline-offset: -2px;
  }

  .md-code-tabs__tab--active {
    background: var(--md-surface-accent, rgba(0, 122, 255, 0.1));
    border-color: var(--md-text-accent, rgb(0, 122, 255));
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .md-code-tabs__tab-label {
    font-weight: var(--font-weight-medium, 500);
  }

  .md-code-tabs__tab-lang {
    padding: 2px 6px;
    background: var(--md-surface-base, rgba(255, 255, 255, 0.05));
    border-radius: var(--md-radius-sm, 6px);
    font-size: var(--md-font-size-xs, 0.75rem);
    font-family: var(--md-font-mono, monospace);
    color: var(--md-text-tertiary, rgba(255, 255, 255, 0.5));
  }

  .md-code-tabs__tab--active .md-code-tabs__tab-lang {
    background: var(--md-text-accent, rgb(0, 122, 255));
    color: white;
  }

  .md-code-tabs__content {
    padding: 0;
    position: relative;
  }

  .md-code-tabs__panel {
    display: none;
  }

  .md-code-tabs__panel--active {
    display: block;
  }

  .md-code-tabs__copy-btn {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-xs, 0.25rem);
    padding: var(--md-spacing-xs, 0.25rem) var(--md-spacing-sm, 0.5rem);
    background: transparent;
    border: 1px solid var(--md-border-medium, rgba(255, 255, 255, 0.1));
    border-radius: var(--md-radius-sm, 6px);
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.7));
    cursor: pointer;
    transition: all var(--md-duration-fast, 0.15s);
    font-size: var(--md-font-size-xs, 0.75rem);
    font-family: var(
      --md-font-sans,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      sans-serif
    );
  }

  .md-code-tabs__copy-btn:hover {
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border-color: var(--md-text-accent, rgb(0, 122, 255));
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .md-code-tabs__code {
    padding: 0;
  }

  .md-code-tabs__code :global(pre) {
    margin: 0 !important;
    border-radius: 0 !important;
    border: none !important;
  }

  .md-code-tabs__loading {
    margin: 0;
    padding: var(--md-spacing-lg, 1.5rem);
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    font-family: var(--md-font-mono, monospace);
    font-size: var(--md-font-size-sm, 0.875rem);
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.7));
    overflow-x: auto;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .md-code-tabs__tab {
      padding: var(--md-spacing-xs, 0.25rem) var(--md-spacing-md, 1rem);
      font-size: var(--md-font-size-xs, 0.75rem);
    }

    .md-code-tabs__tab-lang {
      display: none;
    }

    .md-code-tabs__tab--active .md-code-tabs__tab-lang {
      display: inline-block;
    }
  }
</style>
