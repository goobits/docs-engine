<script lang="ts">
  import { onMount } from 'svelte';

  type DocsTheme = 'dracula' | 'github' | 'minimal';

  interface Props {
    value?: DocsTheme;
    storageKey?: string;
    class?: string;
    onchange?(_nextTheme: DocsTheme): void;
  }

  let {
    value = 'dracula',
    storageKey = 'docs-engine-theme',
    class: className = '',
    onchange,
  }: Props = $props();
  let currentTheme = $state<DocsTheme>('dracula');

  $effect(() => {
    currentTheme = value;
  });

  const ariaLabel = $derived(`Switch from ${currentTheme} theme`);

  onMount(() => {
    const stored = localStorage.getItem(storageKey);
    if (isDocsTheme(stored)) selectTheme(stored);
  });

  function cycleTheme(): void {
    const themes: DocsTheme[] = ['dracula', 'github', 'minimal'];
    selectTheme(themes[(themes.indexOf(currentTheme) + 1) % themes.length]);
  }

  function selectTheme(theme: DocsTheme): void {
    currentTheme = theme;
    localStorage.setItem(storageKey, theme);
    onchange?.(theme);
  }

  function isDocsTheme(theme: string | null): theme is DocsTheme {
    return theme === 'dracula' || theme === 'github' || theme === 'minimal';
  }
</script>

<button
  class="theme-toggle {className}"
  class:theme-toggle--light={currentTheme !== 'dracula'}
  onclick={cycleTheme}
  type="button"
  aria-label={ariaLabel}
  title={`${ariaLabel}. Next: ${currentTheme === 'dracula' ? 'github' : currentTheme === 'github' ? 'minimal' : 'dracula'}`}
>
  <span class="theme-toggle__icon" aria-hidden="true">
    {#if currentTheme === 'dracula'}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    {:else if currentTheme === 'github'}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4"></circle>
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        ></path>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="8"></circle>
        <path d="M12 4v16"></path>
      </svg>
    {/if}
  </span>
  <span class="theme-toggle__label">{currentTheme}</span>
</button>

<style>
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.5rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--docs-border-medium, rgba(255, 255, 255, 0.14));
    border-radius: var(--docs-radius-md, 0.625rem);
    background: var(--docs-surface-raised, rgba(255, 255, 255, 0.08));
    color: var(--docs-text, #f8f8f2);
    cursor: pointer;
    text-transform: capitalize;
  }

  .theme-toggle:hover {
    border-color: var(--docs-accent, #bd93f9);
    background: var(--docs-surface-hover, rgba(255, 255, 255, 0.12));
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--docs-accent, #bd93f9);
    outline-offset: 2px;
  }

  .theme-toggle--light {
    color: var(--docs-text, #24292f);
  }

  .theme-toggle__icon {
    display: inline-flex;
    width: 1.1rem;
    height: 1.1rem;
  }

  .theme-toggle__icon svg {
    width: 100%;
    height: 100%;
  }

  .theme-toggle__label {
    font-size: 0.75rem;
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .theme-toggle__label {
      display: none;
    }
  }
</style>
