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
				// Select only divs with required attributes to avoid wrapper elements
				const elements = document.querySelectorAll('.md-screenshot[data-name][data-path][data-version]');

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
						// This shouldn't happen with the selector above, but keep as safety
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
						// Create fresh container to avoid hydration conflicts
						const container = document.createElement('div');
						element.replaceWith(container);

						// Mount the ScreenshotImage component into fresh container
						mount(ScreenshotImage, {
							target: container,
							props: { name, url, path, version, config }
						});

						// Mark as hydrated
						container.setAttribute('data-hydrated', 'true');
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

		// Defer hydration to avoid conflicts with Svelte's hydration phase
		queueMicrotask(() => {
			requestAnimationFrame(() => {
				hydrate();

				// Set up MutationObserver AFTER initial hydration completes
				// This prevents the observer from triggering during initial DOM modifications
				const observer = new MutationObserver((mutations) => {
					let shouldHydrate = false;
					for (const mutation of mutations) {
						if (mutation.type === 'childList') {
							for (const node of mutation.addedNodes) {
								if (node instanceof Element) {
									if (
										node.matches('.md-screenshot[data-name][data-path][data-version]') ||
										node.querySelector('.md-screenshot[data-name][data-path][data-version]')
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

				// Store observer for cleanup
				return observer;
			});
		});

		return () => {
			unsubscribe?.();
			// Observer will be cleaned up when component unmounts
		};
	});
</script>
