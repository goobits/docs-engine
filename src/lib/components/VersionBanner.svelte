<script lang="ts">
  /**
   * Version Banner Component
   *
   * Shows a warning banner when viewing old or deprecated documentation versions.
   * Links to the latest version of the current page.
   */

  import { X, AlertTriangle, Info } from '@lucide/svelte';
  import { onMount } from 'svelte';

  interface Props {
    /** Current version being viewed */
    currentVersion: string;
    /** Latest version available */
    latestVersion: string;
    /** Version label (deprecated, legacy, etc.) */
    label?: 'deprecated' | 'legacy' | 'outdated';
    /** Custom message (overrides default) */
    message?: string;
    /** URL to latest version of current page */
    latestUrl?: string;
    /** Whether banner can be dismissed */
    dismissible?: boolean;
  }

  let {
    currentVersion,
    latestVersion,
    label,
    message,
    latestUrl,
    dismissible = true,
  }: Props = $props();

  let isDismissed = $state(false);

  // Load dismissed state from localStorage
  onMount(() => {
    if (dismissible && typeof window !== 'undefined') {
      const key = `version-banner-dismissed-${currentVersion}`;
      isDismissed = localStorage.getItem(key) === 'true';
    }
  });

  function dismiss() {
    if (!dismissible) return;

    isDismissed = true;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const key = `version-banner-dismissed-${currentVersion}`;
      localStorage.setItem(key, 'true');
    }
  }

  const defaultMessage = $derived(() => {
    if (message) return message;

    switch (label) {
      case 'deprecated':
        return `This is documentation for v${currentVersion}, which is deprecated. Please upgrade to v${latestVersion}.`;
      case 'legacy':
        return `You're viewing documentation for v${currentVersion}. The latest version is v${latestVersion}.`;
      case 'outdated':
        return `This documentation is for v${currentVersion}. A newer version (v${latestVersion}) is available.`;
      default:
        return `You're viewing v${currentVersion} docs. The latest version is v${latestVersion}.`;
    }
  });

  const bannerType = $derived(() => {
    if (label === 'deprecated') return 'error';
    if (label === 'legacy') return 'warning';
    return 'info';
  });

  const icon = $derived(() => {
    if (bannerType() === 'error') return AlertTriangle;
    if (bannerType() === 'warning') return AlertTriangle;
    return Info;
  });
</script>

{#if !isDismissed}
  <div class="version-banner {bannerType()}" role="alert">
    <div class="version-banner-content">
      <div class="version-banner-icon">
        <svelte:component this={icon()} size={20} />
      </div>
      <div class="version-banner-message">
        <p>{defaultMessage()}</p>
        {#if latestUrl}
          <a href={latestUrl} class="version-banner-link"> View latest documentation → </a>
        {/if}
      </div>
    </div>
    {#if dismissible}
      <button
        class="version-banner-close"
        onclick={dismiss}
        type="button"
        aria-label="Dismiss banner"
      >
        <X size={18} />
      </button>
    {/if}
  </div>
{/if}

<style>
  .version-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--docs-spacing-md, 1rem);
    padding: var(--docs-spacing-md, 1rem) var(--docs-spacing-lg, 1.5rem);
    border-radius: var(--docs-radius-lg, 14px);
    margin-bottom: var(--docs-spacing-xl, 2rem);
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .version-banner.info {
    background: rgba(139, 233, 253, 0.1);
    border: 1px solid rgba(139, 233, 253, 0.3);
  }

  .version-banner.warning {
    background: rgba(241, 250, 140, 0.1);
    border: 1px solid rgba(241, 250, 140, 0.3);
  }

  .version-banner.error {
    background: rgba(255, 121, 198, 0.1);
    border: 1px solid rgba(255, 121, 198, 0.3);
  }

  .version-banner-content {
    display: flex;
    align-items: flex-start;
    gap: var(--docs-spacing-md, 1rem);
    flex: 1;
  }

  .version-banner-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .version-banner.info .version-banner-icon {
    color: rgba(139, 233, 253, 1);
  }

  .version-banner.warning .version-banner-icon {
    color: rgba(241, 250, 140, 1);
  }

  .version-banner.error .version-banner-icon {
    color: rgba(255, 121, 198, 1);
  }

  .version-banner-message {
    flex: 1;
  }

  .version-banner-message p {
    margin: 0 0 var(--docs-spacing-xs, 0.25rem) 0;
    color: var(--docs-text, #f8f8f2);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .version-banner-link {
    display: inline-flex;
    align-items: center;
    color: var(--docs-accent-tertiary, #8be9fd);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .version-banner-link:hover {
    text-decoration: underline;
  }

  .version-banner-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--docs-spacing-xs, 0.25rem);
    background: transparent;
    border: none;
    border-radius: var(--docs-radius-sm, 6px);
    color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .version-banner-close:hover {
    background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
    color: var(--docs-text, #f8f8f2);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .version-banner {
      flex-direction: column;
      align-items: flex-start;
    }

    .version-banner-close {
      align-self: flex-end;
      margin-top: var(--docs-spacing-sm, 0.5rem);
    }
  }
</style>
