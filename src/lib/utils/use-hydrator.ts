/**
 * Hydrator Lifecycle Composable
 *
 * Encapsulates the common lifecycle pattern used by all Hydrator components:
 * - Browser environment check
 * - afterNavigate subscription for SPA navigation
 * - Deferred initial hydration (queueMicrotask + requestAnimationFrame)
 * - Optional MutationObserver for dynamic content
 * - Proper cleanup on unmount
 */

/* eslint-disable no-undef */
// Browser globals are available when this runs (browser check is done first)

import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { afterNavigate } from '$app/navigation';

export interface HydratorOptions {
  /**
   * Optional CSS selector for MutationObserver.
   * When provided, a MutationObserver will watch for elements matching this selector
   * being added to the DOM and trigger hydration automatically.
   */
  observeSelector?: string;

  /**
   * Whether to use requestAnimationFrame for the hydration function.
   * Most hydrators already wrap their logic in rAF, so this defaults to false.
   * Set to true if your hydrate function doesn't use rAF internally.
   */
  wrapInRaf?: boolean;
}

/**
 * Sets up the hydration lifecycle for a Hydrator component.
 *
 * @param hydrate - The hydration function to call
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Basic usage - hydrate function should use requestAnimationFrame internally
 * function hydrate() {
 *   requestAnimationFrame(() => {
 *     const elements = document.querySelectorAll('.my-element');
 *     // ... process elements
 *   });
 * }
 *
 * useHydrator(hydrate);
 * ```
 *
 * @example
 * ```typescript
 * // With MutationObserver for dynamic content
 * useHydrator(hydrate, {
 *   observeSelector: '.md-screenshot[data-name]'
 * });
 * ```
 */
export function useHydrator(hydrate: () => void, options: HydratorOptions = {}): void {
  const { observeSelector, wrapInRaf = false } = options;

  onMount(() => {
    if (!browser) return;

    const wrappedHydrate = wrapInRaf ? (): number => requestAnimationFrame(hydrate) : hydrate;

    // Subscribe to navigation events for SPA navigation
    afterNavigate(() => wrappedHydrate());

    // Defer initial hydration to avoid conflicts with Svelte's hydration phase
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        wrappedHydrate();

        // Set up MutationObserver if selector provided
        if (observeSelector) {
          setupMutationObserver(observeSelector, wrappedHydrate);
        }
      });
    });

    return (): void => {
      // Note: MutationObserver cleanup is handled by the component unmounting
      // and the observer going out of scope
    };
  });
}

/**
 * Sets up a MutationObserver to watch for dynamically added elements.
 * This is useful for hydrating content that's added after initial page load.
 */
function setupMutationObserver(selector: string, hydrate: () => void): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    let shouldHydrate = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element) {
            if (node.matches(selector) || node.querySelector(selector)) {
              shouldHydrate = true;
              break;
            }
          }
        }
      }
      if (shouldHydrate) break;
    }

    if (shouldHydrate) {
      hydrate();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}

export default useHydrator;
