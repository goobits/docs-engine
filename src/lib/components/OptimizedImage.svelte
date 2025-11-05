<script lang="ts">
	/**
	 * Optimized Image Component
	 *
	 * Features:
	 * - Multiple formats (WebP, AVIF) with fallbacks
	 * - Responsive images with srcset
	 * - Lazy loading with IntersectionObserver
	 * - Blur placeholder (LQIP)
	 * - Click-to-zoom functionality
	 *
	 * @component
	 */

	interface Props {
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

	let {
		src,
		alt,
		title,
		width,
		height,
		basePath,
		formats,
		sizes,
		quality,
		lazy,
		zoom,
		placeholder,
		isExternal
	}: Props = $props();

	let imageElement = $state<HTMLImageElement | null>(null);
	let loaded = $state(false);
	let error = $state(false);
	let showLightbox = $state(false);

	/**
	 * Generate optimized image URL
	 * For external images, return as-is
	 * For local images, return path to optimized version
	 */
	function getOptimizedUrl(format: string, size?: number): string {
		if (isExternal) {
			return src;
		}

		// Get file path without extension
		const pathParts = src.split('/');
		const fileName = pathParts[pathParts.length - 1];
		const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, '');
		const directory = pathParts.slice(0, -1).join('/');

		// Build optimized path
		const sizeStr = size ? `-${size}w` : '';
		const formatExt = format === 'original' ? fileName.split('.').pop() : format;

		return `${basePath}/${directory}/${fileNameWithoutExt}${sizeStr}.${formatExt}`;
	}

	/**
	 * Generate srcset for responsive images
	 */
	function generateSrcSet(format: string): string {
		if (isExternal) {
			return '';
		}

		return sizes.map((size) => `${getOptimizedUrl(format, size)} ${size}w`).join(', ');
	}

	/**
	 * Get placeholder image (LQIP)
	 */
	function getPlaceholder(): string {
		if (placeholder === 'none' || isExternal) {
			return '';
		}

		if (placeholder === 'blur') {
			return getOptimizedUrl('jpg', 40); // Tiny 40px width blur placeholder
		}

		// For 'dominant-color', would need build-time color extraction
		return '';
	}

	/**
	 * Handle image load
	 */
	function handleLoad() {
		loaded = true;
	}

	/**
	 * Handle image error
	 */
	function handleError() {
		error = true;
	}

	/**
	 * Handle image click (zoom)
	 */
	function handleClick() {
		if (zoom && !error) {
			showLightbox = true;
		}
	}

	/**
	 * Close lightbox
	 */
	function closeLightbox() {
		showLightbox = false;
	}

	/**
	 * Handle escape key
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeLightbox();
		}
	}

	// Lazy loading with IntersectionObserver
	$effect(() => {
		if (!lazy || !imageElement) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && imageElement) {
						// Trigger load by setting src
						const img = imageElement;
						if (img.dataset.src) {
							img.src = img.dataset.src;
							delete img.dataset.src;
						}
						observer.disconnect();
					}
				});
			},
			{ rootMargin: '50px' }
		);

		observer.observe(imageElement);

		return () => {
			observer.disconnect();
		};
	});

	const placeholderUrl = getPlaceholder();
	const mainFormat = formats[0] || 'original';
	const mainSrc = getOptimizedUrl(mainFormat);
	const srcSet = generateSrcSet(mainFormat);
</script>

<svelte:window onkeydown={handleKeydown} />

<figure class="optimized-image-container">
	<picture>
		{#if !isExternal}
			<!-- Generate source tags for each format -->
			{#each formats as format}
				{#if format !== 'original'}
					<source
						type="image/{format}"
						srcset={generateSrcSet(format)}
						sizes="(max-width: 640px) 100vw, (max-width: 960px) 90vw, (max-width: 1280px) 80vw, 1280px"
					/>
				{/if}
			{/each}
		{/if}

		<!-- Main image element -->
		<img
			bind:this={imageElement}
			src={lazy && placeholderUrl ? placeholderUrl : mainSrc}
			data-src={lazy && placeholderUrl ? mainSrc : undefined}
			{alt}
			{title}
			{width}
			{height}
			srcset={lazy ? undefined : srcSet}
			loading={lazy ? 'lazy' : 'eager'}
			class="optimized-image"
			class:loaded
			class:error
			class:zoomable={zoom}
			onload={handleLoad}
			onerror={handleError}
			onclick={handleClick}
		/>
	</picture>

	{#if title}
		<figcaption class="image-caption">{title}</figcaption>
	{/if}
</figure>

<!-- Lightbox Modal -->
{#if showLightbox}
	<div class="image-lightbox" onclick={closeLightbox} role="dialog" aria-label="Image viewer">
		<div class="lightbox-backdrop"></div>
		<div class="lightbox-content">
			<button class="lightbox-close" onclick={closeLightbox} aria-label="Close">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<line x1="18" y1="6" x2="6" y2="18" stroke-width="2" />
					<line x1="6" y1="6" x2="18" y2="18" stroke-width="2" />
				</svg>
			</button>
			<img
				src={getOptimizedUrl(mainFormat)}
				{alt}
				class="lightbox-image"
			/>
			{#if title}
				<div class="lightbox-caption">{title}</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.optimized-image-container {
		margin: 2rem 0;
		text-align: center;
	}

	picture {
		display: block;
	}

	.optimized-image {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		transition: opacity 0.3s ease, filter 0.3s ease;
	}

	.optimized-image:not(.loaded) {
		filter: blur(10px);
		opacity: 0.8;
	}

	.optimized-image.loaded {
		filter: none;
		opacity: 1;
	}

	.optimized-image.error {
		border: 2px dashed #e53e3e;
		padding: 2rem;
		background: #fee;
	}

	.optimized-image.zoomable {
		cursor: zoom-in;
	}

	.optimized-image.zoomable:hover {
		opacity: 0.9;
	}

	.image-caption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--docs-text-secondary, #666);
		font-style: italic;
	}

	/* Lightbox */
	.image-lightbox {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.2s ease;
	}

	.lightbox-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
	}

	.lightbox-content {
		position: relative;
		max-width: 95vw;
		max-height: 95vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.lightbox-close {
		position: absolute;
		top: -3rem;
		right: 0;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s ease;
	}

	.lightbox-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.lightbox-image {
		max-width: 100%;
		max-height: 85vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
	}

	.lightbox-caption {
		color: white;
		font-size: 0.875rem;
		text-align: center;
		max-width: 80%;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Dark mode support */
	:global(.dark) .image-caption {
		color: var(--docs-text-secondary, #aaa);
	}
</style>
