<script lang="ts">
  /**
   * Client-side hydrator for OpenAPI documentation
   *
   * Finds all OpenAPI doc elements and mounts OpenAPIDoc components
   * Use this in your layout or page to hydrate static HTML
   */
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { mount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import OpenAPIDoc from './OpenAPIDoc.svelte';
  import { parseOpenAPISpec, filterEndpointsByPath } from '../utils/openapi-formatter';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  interface Props {
    /** Theme for styling */
    theme?: string;
    /** Base URL for API endpoints */
    baseUrl?: string;
  }

  let { theme = 'dracula', baseUrl = '/api' }: Props = $props();

  function hydrate() {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      try {
        const elements = document.querySelectorAll('.md-openapi-doc[data-spec][data-path-filter]');

        for (const element of elements) {
          const encoded = element.getAttribute('data-spec');
          const pathFilter = element.getAttribute('data-path-filter') || '';

          if (!encoded) {
            console.warn('[OpenAPIHydrator] Element missing data-spec attribute');
            continue;
          }

          try {
            // Decode base64 spec
            const specJson = atob(encoded);
            const spec = JSON.parse(specJson);

            // Parse and filter endpoints
            const allEndpoints = parseOpenAPISpec(spec);
            const filteredEndpoints = filterEndpointsByPath(allEndpoints, pathFilter);

            if (filteredEndpoints.length === 0) {
              // Show "no endpoints found" message
              element.innerHTML = `
								<div style="padding: 1rem; background: rgba(241, 250, 140, 0.1); border: 1px solid rgba(241, 250, 140, 0.3); border-radius: 0.5rem; color: #f1fa8c;">
									<strong>No endpoints found</strong> for path filter: <code>${sanitizeHtml(pathFilter, { allowedTags: [], allowedAttributes: [] })}</code>
								</div>
							`;
              continue;
            }

            // Clear the element
            element.innerHTML = '';

            // Mount an OpenAPIDoc component for each endpoint
            for (const endpoint of filteredEndpoints) {
              const wrapper = document.createElement('div');
              wrapper.className = 'openapi-doc-wrapper';
              element.appendChild(wrapper);

              mount(OpenAPIDoc, {
                target: wrapper,
                props: { endpoint, theme, baseUrl },
              });
            }

            // Remove the data attributes to prevent re-hydration
            element.removeAttribute('data-spec');
            element.removeAttribute('data-path-filter');
          } catch (err) {
            console.error(`[OpenAPIHydrator] Failed to parse or mount OpenAPI docs:`, err);

            // Show error message
            element.innerHTML = `
							<div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
								<strong>Error:</strong> Failed to parse OpenAPI specification. Check the console for details.
							</div>
						`;
          }
        }
      } catch (err) {
        console.error('[OpenAPIHydrator] Fatal error:', err);
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

<style>
  :global(.openapi-doc-wrapper + .openapi-doc-wrapper) {
    margin-top: 1.5rem;
  }
</style>
