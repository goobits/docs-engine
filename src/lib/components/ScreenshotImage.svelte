<script lang="ts">
  /**
   * ScreenshotImage Component
   *
   * Lazy-loading screenshot component with cache checking and on-demand generation
   * Part of @goobits/markdown-docs screenshot system
   */

  import { onMount } from 'svelte';
  import type { ScreenshotImageProps } from './types.js';

  interface Props extends ScreenshotImageProps {}

  let { name, url, path, version, config = {} }: Props = $props();

  let status: 'checking' | 'cached' | 'generating' | 'ready' | 'error' = $state('checking');
  let imageSrc = $state('');
  let webpSrc = $state('');
  let webpSrcset = $state('');
  let width = $state<number | undefined>(undefined);
  let height = $state<number | undefined>(undefined);
  let error = $state('');

  onMount(async () => {
    // Check if screenshot is already cached
    try {
      const cacheCheck = await fetch(path, { method: 'HEAD' });

      if (cacheCheck.ok) {
        status = 'cached';
        imageSrc = path;
        webpSrc = path.replace('.png', '.webp');
        const webp2x = path.replace('.png', '@2x.webp');
        webpSrcset = `${webpSrc} 1x, ${webp2x} 2x`;

        // Try to get dimensions from existing metadata
        try {
          const metaResponse = await fetch('/api/screenshots/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, version }),
          });

          // Only parse if response is OK, silently ignore errors
          if (metaResponse.ok) {
            const metaData = await metaResponse.json();
            if (metaData.width) {
              width = metaData.width;
              height = metaData.height;
            }
          }
        } catch (e) {
          // Dimensions not critical, continue without them
        }

        status = 'ready';
      } else {
        // Generate screenshot on demand
        status = 'generating';
        try {
          const response = await fetch('/api/screenshots/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url, version, config }),
          });

          const data = await response.json();
          if (data.success) {
            imageSrc = data.path;
            webpSrc = data.webpPath || data.path.replace('.png', '.webp');
            width = data.width;
            height = data.height;

            // Build srcset for retina displays
            if (data.webp2xPath) {
              webpSrcset = `${webpSrc} 1x, ${data.webp2xPath} 2x`;
            } else {
              webpSrcset = webpSrc;
            }

            status = 'ready';
          } else {
            throw new Error(data.error || 'Failed to generate screenshot');
          }
        } catch (e: any) {
          status = 'error';
          error = e.message;
        }
      }
    } catch (e: any) {
      status = 'error';
      error = e.message;
    }
  });
</script>

<div class="md-screenshot" data-status={status}>
  {#if status === 'checking' || status === 'generating'}
    <div class="md-screenshot__loading">
      <div class="md-screenshot__spinner"></div>
      <p class="md-screenshot__loading-text">
        {status === 'checking' ? 'Checking cache...' : 'Generating screenshot...'}
      </p>
    </div>
  {:else if status === 'ready'}
    <picture>
      <source srcset={webpSrcset} type="image/webp" />
      <img
        src={imageSrc}
        alt="Screenshot: {name}"
        {width}
        {height}
        loading="lazy"
        decoding="async"
        class="md-screenshot__image"
      />
    </picture>
    <div class="md-screenshot__meta">
      <span class="md-screenshot__version">v{version}</span>
      <span class="md-screenshot__name">{name}</span>
    </div>
  {:else if status === 'error'}
    <div class="md-screenshot__error">
      <p>Failed to load screenshot</p>
      <p class="md-screenshot__error-message">{error}</p>
    </div>
  {/if}
</div>

<style>
  .md-screenshot {
    position: relative;
    width: 100%;
    background: var(--v2-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: var(--v2-radius-lg, 14px);
    overflow: hidden;
  }

  .md-screenshot__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--v2-spacing-md, 1rem);
    padding: var(--v2-spacing-xl, 2rem);
    min-height: 400px;
  }

  .md-screenshot__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
    border-top-color: var(--v2-text-accent, rgb(0, 122, 255));
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .md-screenshot__loading-text {
    font-size: var(--v2-font-size-sm, 0.875rem);
    color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
    margin: 0;
  }

  .md-screenshot__image {
    width: 100%;
    height: auto;
    display: block;
  }

  .md-screenshot__meta {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--v2-spacing-sm, 0.5rem) var(--v2-spacing-md, 1rem);
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    opacity: 0;
    transition: opacity var(--v2-duration-fast, 200ms)
      var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
  }

  .md-screenshot:hover .md-screenshot__meta {
    opacity: 1;
  }

  .md-screenshot__version {
    font-size: var(--v2-font-size-xs, 0.75rem);
    font-weight: 600;
    color: var(--v2-text-accent, rgb(0, 122, 255));
    background: var(--v2-surface-elevated, rgba(255, 255, 255, 0.09));
    padding: var(--v2-spacing-xs, 0.25rem) var(--v2-spacing-sm, 0.5rem);
    border-radius: var(--v2-radius-sm, 6px);
    border: 1px solid var(--v2-border-medium, rgba(255, 255, 255, 0.12));
  }

  .md-screenshot__name {
    font-size: var(--v2-font-size-xs, 0.75rem);
    color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
    font-family: var(--v2-font-mono, monospace);
  }

  .md-screenshot__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--v2-spacing-sm, 0.5rem);
    padding: var(--v2-spacing-xl, 2rem);
    text-align: center;
    min-height: 400px;
  }

  .md-screenshot__error p {
    font-size: var(--v2-font-size-sm, 0.875rem);
    color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
    margin: 0;
  }

  .md-screenshot__error-message {
    font-size: var(--v2-font-size-xs, 0.75rem);
    color: var(--v2-text-tertiary, rgba(255, 255, 255, 0.5));
    font-family: var(--v2-font-mono, monospace);
  }

  /* Status-specific styling */
  .md-screenshot[data-status='error'] {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }

  .md-screenshot[data-status='ready'] {
    min-height: auto;
  }
</style>
