<script lang="ts">
	/**
	 * Client-side hydrator for screenshots
	 *
	 * Finds all .md-screenshot divs and hydrates them into interactive screenshot components
	 * Handles both web and CLI screenshots with lazy loading and generation
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { mount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import ScreenshotImage from './ScreenshotImage.svelte';

	function hydrate() {
		// Use requestAnimationFrame to ensure DOM is fully rendered
		requestAnimationFrame(() => {
			try {
				const elements = document.querySelectorAll('.md-screenshot');

				for (const element of elements) {
					// Skip if already hydrated
					if (element.hasAttribute('data-hydrated')) {
						continue;
					}

					const name = element.getAttribute('data-name');
					const url = element.getAttribute('data-url') || '';
					const path = element.getAttribute('data-path');
					const version = element.getAttribute('data-version');
					const configAttr = element.getAttribute('data-config');

					if (!name || !path || !version) {
						console.warn('[ScreenshotHydrator] Element missing required attributes', {
							name,
							path,
							version
						});
						continue;
					}

					let config = {};
					if (configAttr) {
						try {
							config = JSON.parse(atob(configAttr));
						} catch (err) {
							console.error('[ScreenshotHydrator] Failed to parse config:', err);
						}
					}

					try {
						// Clear existing content
						element.innerHTML = '';

						// Mount the ScreenshotImage component
						mount(ScreenshotImage, {
							target: element,
							props: { name, url, path, version, config }
						});

						// Mark as hydrated
						element.setAttribute('data-hydrated', 'true');
					} catch (err) {
						console.error(`[ScreenshotHydrator] Failed to mount screenshot ${name}:`, err);
						element.innerHTML = `<div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
							<strong>Screenshot Error</strong>
							<p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">Failed to load screenshot. ${err instanceof Error ? err.message : String(err)}</p>
						</div>`;
					}
				}
			} catch (err) {
				console.error('[ScreenshotHydrator] Fatal error:', err);
			}
		});
	}

	onMount(() => {
		if (!browser) return;

		const unsubscribe = afterNavigate(() => hydrate());
		hydrate();

		// Watch for new screenshot divs being added dynamically (e.g., from tabs)
		const observer = new MutationObserver((mutations) => {
			let shouldHydrate = false;
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					for (const node of mutation.addedNodes) {
						if (node instanceof Element) {
							if (
								node.classList.contains('md-screenshot') ||
								node.querySelector('.md-screenshot')
							) {
								shouldHydrate = true;
								break;
							}
						}
					}
				}
			}
			if (shouldHydrate) {
				hydrate();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		return () => {
			unsubscribe?.();
			observer.disconnect();
		};
	});
</script>
