<script lang="ts">
  import type { DocsLoadingIndicator } from './loadingIndicator.js';
  /**
   * ScreenshotImage Component
   *
   * Lazy-loading screenshot component with cache checking and on-demand generation
   * Part of @goobits/markdown-docs screenshot system
   */

  import { onMount } from 'svelte';

  export interface ScreenshotImageProps {
    name: string;
    url: string;
    path: string;
    version: string;
    config?: unknown;
    loadingIndicator?: DocsLoadingIndicator;
  }

  interface Props extends ScreenshotImageProps {}

  let {
    name,
    url,
    path,
    version,
    config = {},
    loadingIndicator: LoadingIndicator,
  }: Props = $props();

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
        } catch {
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
    <div class="md-screenshot__loading" role="status" aria-live="polite">
      {#if LoadingIndicator}
        <LoadingIndicator size="40px" thickness="3px" ariaHidden />
      {/if}
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
    background: var(--color-background);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-2xl);
    overflow: hidden;
  }

  .md-screenshot__loading {
    --goo-theme-accent: var(--color-text-accent);
    --goo-theme-radius-full: 9999px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-8);
    min-height: 400px;
  }

  .md-screenshot__loading-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
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
    padding: var(--space-2) var(--space-4);
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    opacity: 0;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .md-screenshot:hover .md-screenshot__meta {
    opacity: 1;
  }

  .md-screenshot__version {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-accent);
    background: var(--color-surface-elevated);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-medium);
  }

  .md-screenshot__name {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    font-family: var(--font-family-mono);
  }

  .md-screenshot__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8);
    text-align: center;
    min-height: 400px;
  }

  .md-screenshot__error p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .md-screenshot__error-message {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    font-family: var(--font-family-mono);
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
