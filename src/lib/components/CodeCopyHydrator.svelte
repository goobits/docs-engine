<script lang="ts">
  /**
   * Client-side hydrator for code copy buttons
   *
   * Finds all code blocks with data-copy-code attribute and mounts copy buttons
   * Use this in your layout or page to hydrate static HTML
   */
  import { mount } from 'svelte';
  import CodeCopyButton from './CodeCopyButton.svelte';
  import { useHydrator } from '@goobits/docs-engine/utils';

  interface Props {
    /** Theme for styling */
    theme?: string;
  }

  let { theme = 'dracula' }: Props = $props();

  function hydrate() {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      try {
        const elements = document.querySelectorAll('pre[data-copy-code]');

        for (const element of elements) {
          const encoded = element.getAttribute('data-copy-code');
          const lang = element.getAttribute('data-lang') || 'plaintext';

          if (!encoded) {
            console.warn('[CodeCopyHydrator] Element missing data-copy-code attribute');
            continue;
          }

          try {
            // Decode base64 code
            const code = atob(encoded);

            // Find or create the wrapper container
            let container = element.parentElement;
            if (!container?.classList.contains('md-code-with-copy')) {
              // Wrap the pre element if not already wrapped
              const wrapper = document.createElement('div');
              wrapper.className = 'md-code-with-copy';
              wrapper.style.position = 'relative';
              element.parentNode?.insertBefore(wrapper, element);
              wrapper.appendChild(element);
              container = wrapper;
            }

            // Mount the copy button as a sibling to the pre element
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'code-copy-button-container';
            container.appendChild(buttonContainer);

            mount(CodeCopyButton, {
              target: buttonContainer,
              props: { code, language: lang, theme },
            });

            // Remove the data attribute to prevent re-hydration
            element.removeAttribute('data-copy-code');
          } catch (err) {
            console.error(`[CodeCopyHydrator] Failed to mount copy button:`, err);
          }
        }
      } catch (err) {
        console.error('[CodeCopyHydrator] Fatal error:', err);
      }
    });
  }

  useHydrator(hydrate);
</script>
