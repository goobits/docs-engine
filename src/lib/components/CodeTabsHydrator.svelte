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

	interface Props {
		/** Theme for syntax highlighting */
		theme?: string;
	}

	let { theme = 'dracula' }: Props = $props();

	function hydrate() {
		// Use requestAnimationFrame to ensure DOM is fully rendered
		requestAnimationFrame(() => {
			try {
				const elements = document.querySelectorAll('.md-code-tabs[data-tabs][data-tabs-id]');

				for (const element of elements) {
					const tabs = element.getAttribute('data-tabs');
					const tabsId = element.getAttribute('data-tabs-id');

					if (!tabs || !tabsId) {
						console.warn('[CodeTabsHydrator] Element missing data-tabs or data-tabs-id');
						continue;
					}

					try {
						element.innerHTML = '';

						mount(CodeTabs, {
							target: element,
							props: { tabs, tabsId, theme }
						});

						element.removeAttribute('data-tabs');
					} catch (err) {
						console.error(`[CodeTabsHydrator] Failed to mount tabs ${tabsId}:`, err);
						element.innerHTML = `<div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
							<strong>Code Tabs Error</strong>
							<p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">Failed to load code tabs. ${err instanceof Error ? err.message : String(err)}</p>
						</div>`;
					}
				}
			} catch (err) {
				console.error('[CodeTabsHydrator] Fatal error:', err);
			}
		});
	}

	onMount(() => {
		if (!browser) return;

		const unsubscribe = afterNavigate(() => hydrate());
		hydrate();

		return () => {
			unsubscribe?.();
		};
	});
</script>
