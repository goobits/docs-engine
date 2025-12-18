<script lang="ts">
  /**
   * Client-side hydrator for code tabs
   *
   * Finds all .md-code-tabs divs and hydrates them into interactive tabs
   * Use this in your layout or page to hydrate static HTML
   */
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { mount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import CodeTabs from './CodeTabs.svelte';
  import { createBrowserLogger } from '@goobits/docs-engine/utils';

  const logger = createBrowserLogger('CodeTabsHydrator');

  interface Props {
    /** Theme for syntax highlighting */
    theme?: string;
  }

  let { theme = 'dracula' }: Props = $props();

  // Simple HTML escape for error messages
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hydrate() {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      try {
        const elements = document.querySelectorAll('.md-code-tabs[data-tabs][data-tabs-id]');

        for (const element of elements) {
          const tabs = element.getAttribute('data-tabs');
          const tabsId = element.getAttribute('data-tabs-id');

          if (!tabs || !tabsId) {
            logger.warn('Element missing data-tabs or data-tabs-id');
            continue;
          }

          try {
            element.innerHTML = '';

            mount(CodeTabs, {
              target: element,
              props: { tabs, tabsId, theme },
            });

            element.removeAttribute('data-tabs');
          } catch (err) {
            logger.error(err, tabsId);
            const errorMsg = err instanceof Error ? err.message : String(err);
            element.innerHTML = `<div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
							<strong>Code Tabs Error</strong>
							<p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">Failed to load code tabs. ${escapeHtml(errorMsg)}</p>
						</div>`;
          }
        }
      } catch (err) {
        logger.error(err);
      }
    });
  }

  onMount(() => {
    if (!browser) return;

    const unsubscribe = afterNavigate(() => hydrate());
    // Defer hydration to avoid conflicts with Svelte's hydration phase
    queueMicrotask(() => {
      requestAnimationFrame(hydrate);
    });

    return () => {
      unsubscribe?.();
    };
  });
</script>
