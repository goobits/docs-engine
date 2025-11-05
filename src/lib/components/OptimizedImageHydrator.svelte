<script lang="ts">
	/**
	 * Optimized Image Hydrator
	 *
	 * Finds all `.md-optimized-image` placeholder divs and hydrates them
	 * with interactive OptimizedImage components.
	 *
	 * This runs client-side after the page loads, replacing static HTML
	 * with fully functional optimized image components.
	 *
	 * @component
	 */

	import { onMount } from 'svelte';
	import { mount, unmount } from 'svelte';
	import OptimizedImage from './OptimizedImage.svelte';
	import { decodeJsonBase64 } from '../utils/base64';

	interface ImageConfig {
		src: string;
		alt: string;
		title?: string;
		width?: number;
		height?: number;
		basePath: string;
		formats: string[];
		sizes: number[];
		quality: Record<string, number>;
		lazy: boolean;
		zoom: boolean;
		placeholder: string;
		isExternal: boolean;
	}

	let mounted: Array<{ element: HTMLElement; component: any }> = [];

	onMount(() => {
		// Find all placeholder divs
		const placeholders = document.querySelectorAll('.md-optimized-image');

		placeholders.forEach((placeholder) => {
			const element = placeholder as HTMLElement;
			const encodedConfig = element.getAttribute('data-config');

			if (!encodedConfig) {
				console.warn('[OptimizedImageHydrator] Missing data-config attribute');
				return;
			}

			try {
				// Decode configuration
				const config: ImageConfig = decodeJsonBase64(encodedConfig);

				// Create container for Svelte component
				const container = document.createElement('div');
				element.replaceWith(container);

				// Mount OptimizedImage component
				const component = mount(OptimizedImage, {
					target: container,
					props: config
				});

				// Track for cleanup
				mounted.push({ element: container, component });
			} catch (error) {
				console.error('[OptimizedImageHydrator] Failed to hydrate image:', error);
			}
		});

		// Cleanup function
		return () => {
			mounted.forEach(({ component }) => {
				unmount(component);
			});
			mounted = [];
		};
	});
</script>

<!-- This component has no visual output; it's purely for hydration -->
