<script lang="ts">
  /**
   * Version Switcher Component
   *
   * Dropdown to switch between documentation versions.
   * Navigates to the same page in the selected version, or home if page doesn't exist.
   */

  import { ChevronDown } from '@lucide/svelte';

  export interface Version {
    version: string;
    label?: 'latest' | 'stable' | 'legacy' | 'deprecated';
  }

  interface Props {
    /** All available versions */
    versions: Version[];
    /** Current version */
    currentVersion: string;
    /** Current page path (for navigation to same page in different version) */
    currentPath?: string;
    /** Base URL for versioned docs (default: "/docs") */
    baseUrl?: string;
  }

  let { versions, currentVersion, currentPath = '', baseUrl = '/docs' }: Props = $props();

  let isOpen = $state(false);

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectVersion(version: string) {
    isOpen = false;

    // Build target URL
    let targetUrl = `${baseUrl}/v${version}`;

    // Try to preserve current path
    if (currentPath) {
      targetUrl += currentPath;
    }

    // Navigate
    window.location.href = targetUrl;
  }

  function getLabelColor(label?: string): string {
    switch (label) {
      case 'latest':
        return 'var(--docs-accent, #bd93f9)';
      case 'stable':
        return 'var(--docs-accent-tertiary, #8be9fd)';
      case 'legacy':
        return 'var(--docs-text-secondary, rgba(248, 248, 242, 0.7))';
      case 'deprecated':
        return 'var(--docs-accent-secondary, #ff79c6)';
      default:
        return 'var(--docs-text-secondary, rgba(248, 248, 242, 0.7))';
    }
  }

  const currentVersionObj = $derived(
    versions.find((v) => v.version === currentVersion) || versions[0]
  );
</script>

<div class="version-switcher">
  <button
    class="version-switcher-trigger"
    onclick={toggleDropdown}
    type="button"
    aria-label="Select version"
    aria-expanded={isOpen}
  >
    <span class="version-switcher-current">
      <span class="version-switcher-version">v{currentVersion}</span>
      {#if currentVersionObj?.label}
        <span
          class="version-switcher-label"
          style="color: {getLabelColor(currentVersionObj.label)}"
        >
          {currentVersionObj.label}
        </span>
      {/if}
    </span>
    <ChevronDown size={16} class="version-switcher-icon {isOpen ? 'open' : ''}" />
  </button>

  {#if isOpen}
    <div class="version-switcher-dropdown">
      {#each versions as version (version.version)}
        <button
          class="version-switcher-option {version.version === currentVersion ? 'active' : ''}"
          onclick={() => selectVersion(version.version)}
          type="button"
        >
          <span class="version-switcher-version">v{version.version}</span>
          {#if version.label}
            <span class="version-switcher-label" style="color: {getLabelColor(version.label)}">
              {version.label}
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
  <button
    class="version-switcher-backdrop"
    onclick={() => (isOpen = false)}
    type="button"
    aria-label="Close version switcher"
  ></button>
{/if}

<style>
  .version-switcher {
    position: relative;
    display: inline-block;
  }

  .version-switcher-trigger {
    display: flex;
    align-items: center;
    gap: var(--docs-spacing-sm, 0.5rem);
    padding: var(--docs-spacing-sm, 0.5rem) var(--docs-spacing-md, 1rem);
    background: var(--docs-surface, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
    border-radius: var(--docs-radius-md, 10px);
    color: var(--docs-text, #f8f8f2);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 140px;
  }

  .version-switcher-trigger:hover {
    background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--docs-accent, #bd93f9);
  }

  .version-switcher-current {
    display: flex;
    align-items: center;
    gap: var(--docs-spacing-xs, 0.25rem);
    flex: 1;
  }

  .version-switcher-version {
    font-weight: 600;
  }

  .version-switcher-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .version-switcher-icon {
    transition: transform 0.2s ease;
  }

  .version-switcher-icon.open {
    transform: rotate(180deg);
  }

  .version-switcher-dropdown {
    position: absolute;
    top: calc(100% + var(--docs-spacing-xs, 0.25rem));
    left: 0;
    right: 0;
    background: var(--docs-surface-raised, rgba(255, 255, 255, 0.06));
    backdrop-filter: blur(20px);
    border: 1px solid var(--docs-border-medium, rgba(255, 255, 255, 0.12));
    border-radius: var(--docs-radius-md, 10px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .version-switcher-option {
    display: flex;
    align-items: center;
    gap: var(--docs-spacing-xs, 0.25rem);
    width: 100%;
    padding: var(--docs-spacing-sm, 0.5rem) var(--docs-spacing-md, 1rem);
    background: transparent;
    border: none;
    border-radius: 0;
    color: var(--docs-text, #f8f8f2);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .version-switcher-option:hover {
    background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
  }

  .version-switcher-option.active {
    background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
    border-left: 3px solid var(--docs-accent, #bd93f9);
  }

  .version-switcher-backdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    border: none;
    z-index: 999;
    cursor: default;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .version-switcher-trigger {
      min-width: auto;
    }
  }
</style>
