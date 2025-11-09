<script lang="ts">
  /**
   * ThemeToggle Component
   *
   * @public
   *
   * A theme toggle button that cycles between light, dark, and system themes.
   * Integrates with @goobits/themes for consistent theme management.
   *
   * Features:
   * - Cycles through light → dark → system
   * - Persists theme preference via @goobits/themes store
   * - Smooth transitions between themes
   * - Accessible (keyboard navigation, ARIA labels)
   * - BEM CSS naming convention
   *
   * @example
   * ```svelte
   * <ThemeToggle />
   * ```
   */

  import { getContext, onMount } from 'svelte';
  import type { ThemeStore } from '@goobits/themes/svelte';

  interface Props {
    /** Custom class name for additional styling */
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  // Get theme store from context (may be null during SSR)
  let themeStore: ThemeStore | undefined;
  try {
    themeStore = getContext<ThemeStore>('theme');
  } catch {
    // Context not available during SSR
  }

  let mounted = $state(false);

  // Get current theme from store (default to 'system' during SSR)
  const currentTheme = $derived(themeStore?.theme ?? 'system');

  // Determine display theme (resolve 'system' to actual theme)
  const displayTheme = $derived.by(() => {
    if (currentTheme === 'system') {
      // Detect system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return currentTheme;
  });

  // Derived state for accessibility
  const ariaLabel = $derived(
    currentTheme === 'light'
      ? 'Switch to dark theme'
      : currentTheme === 'dark'
        ? 'Switch to system theme'
        : 'Switch to light theme'
  );

  /**
   * Cycle through themes: light → dark → system → light
   */
  function cycleTheme() {
    if (themeStore) {
      themeStore.cycleMode();
    }
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      cycleTheme();
    }
  }

  // Mark as mounted to prevent hydration mismatches
  onMount(() => {
    mounted = true;
  });
</script>

<button
  class="theme-toggle {className}"
  onclick={cycleTheme}
  onkeydown={handleKeydown}
  type="button"
  role="switch"
  aria-checked={displayTheme === 'dark'}
  aria-label={ariaLabel}
  title={ariaLabel}
>
  <span class="theme-toggle__icon-wrapper">
    {#if mounted}
      {#if displayTheme === 'light'}
        <!-- Sun Icon (Light Mode) -->
        <svg
          class="theme-toggle__icon theme-toggle__icon--sun"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      {:else}
        <!-- Moon Icon (Dark Mode) -->
        <svg
          class="theme-toggle__icon theme-toggle__icon--moon"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      {/if}
    {:else}
      <!-- Placeholder to prevent layout shift -->
      <svg
        class="theme-toggle__icon"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" opacity="0"></circle>
      </svg>
    {/if}
  </span>
</button>

<style>
  /* ============================================================================
     Theme Toggle Component - BEM Architecture
     ========================================================================== */

  .theme-toggle {
    /* Reset button styles */
    appearance: none;
    border: none;
    background: none;
    margin: 0;
    padding: 0;

    /* Layout */
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--space-10, 2.5rem);
    height: var(--space-10, 2.5rem);

    /* Visual */
    background-color: var(--color-surface, hsla(0, 0%, 100%, 0.03));
    border: 1px solid var(--color-border-medium, hsla(0, 0%, 0%, 0.12));
    border-radius: var(--radius-lg, 0.5rem);
    color: var(--color-text-primary, hsla(0, 0%, 0%, 0.95));

    /* Interaction */
    cursor: pointer;
    transition:
      background-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0, 0, 0.2, 1)),
      border-color var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0, 0, 0.2, 1)),
      box-shadow var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0, 0, 0.2, 1)),
      transform var(--duration-fast, 150ms) var(--ease-out, cubic-bezier(0, 0, 0.2, 1));

    &:hover {
      background-color: var(--color-surface-raised, hsla(0, 0%, 100%, 0.06));
      border-color: var(--color-border-strong, hsla(0, 0%, 0%, 0.24));
      box-shadow: var(--shadow-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.1));
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary-500, hsl(211, 100%, 50%));
      outline-offset: 2px;
    }

    &:active {
      transform: scale(0.95);
    }

    /* Dark theme adjustments */
    :global(.theme-dark) &,
    :global(.theme-system-dark) & {
      background-color: var(--color-surface, hsla(0, 0%, 100%, 0.03));
      border-color: var(--color-border-medium, hsla(0, 0%, 100%, 0.12));
      color: var(--color-text-primary, hsla(0, 0%, 100%, 0.95));

      &:hover {
        background-color: var(--color-surface-raised, hsla(0, 0%, 100%, 0.06));
        border-color: var(--color-border-strong, hsla(0, 0%, 100%, 0.24));
      }
    }
  }

  /* Icon wrapper for transitions */
  .theme-toggle__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  /* Icon base styles */
  .theme-toggle__icon {
    width: 1.25rem;
    height: 1.25rem;
    color: currentColor;
    transition: transform var(--duration-normal, 200ms) var(--ease-out, cubic-bezier(0, 0, 0.2, 1));

    /* Animation on hover */
    .theme-toggle:hover & {
      transform: scale(1.1);
    }
  }

  /* Sun icon specific styles */
  .theme-toggle__icon--sun {
    color: var(--color-warning-500, hsl(38, 92%, 50%));
    animation: rotate 20s linear infinite;

    .theme-toggle:hover & {
      animation-duration: 2s;
    }
  }

  /* Moon icon specific styles */
  .theme-toggle__icon--moon {
    color: var(--color-primary-400, hsl(211, 100%, 68%));
  }

  /* Rotation animation for sun */
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
