<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		/** Base64-encoded mermaid diagram source */
		diagram: string;
		/** Optional theme (default, dark, forest, neutral) */
		theme?: 'default' | 'dark' | 'forest' | 'neutral';
	}

	let { diagram, theme = 'dark' }: Props = $props();

	let container: HTMLDivElement;
	let modalContainer: HTMLDivElement;
	let rendered = $state(false);
	let error = $state('');
	let isModalOpen = $state(false);

	// Zoom and pan state
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartPanX = 0;
	let dragStartPanY = 0;

	function openModal() {
		if (!error && rendered) {
			isModalOpen = true;
		}
	}

	function closeModal() {
		isModalOpen = false;
		// Reset zoom and pan
		zoom = 1;
		panX = 0;
		panY = 0;
		isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		e.stopPropagation();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
		zoom = newZoom;
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button === 0) { // Left click only
			isDragging = true;
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			dragStartPanX = panX;
			dragStartPanY = panY;
			e.preventDefault();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			const deltaX = e.clientX - dragStartX;
			const deltaY = e.clientY - dragStartY;
			panX = dragStartPanX + deltaX;
			panY = dragStartPanY + deltaY;
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function zoomIn() {
		zoom = Math.min(10, zoom * 1.2);
	}

	function zoomOut() {
		zoom = Math.max(0.1, zoom / 1.2);
	}

	function resetZoom() {
		zoom = 1;
		panX = 0;
		panY = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeModal();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}

	onMount(async () => {
		try {
			// Dynamic import mermaid (it's a peer dependency)
			const mermaid = (await import('mermaid')).default;

			// Configure mermaid
			mermaid.initialize({
				startOnLoad: false,
				theme,
				securityLevel: 'loose',
				fontFamily: 'var(--md-font-mono, monospace)'
			});

			// Decode diagram
			const source = Buffer.from(diagram, 'base64').toString('utf-8');

			// Generate unique ID for inline diagram
			const id = `mermaid-${Math.random().toString(36).substring(7)}`;

			// Render diagram for inline display
			const { svg } = await mermaid.render(id, source);

			if (container) {
				container.innerHTML = svg;
				rendered = true;
			}

			// Render diagram for modal (same diagram, will be cloned)
			if (modalContainer) {
				const modalId = `mermaid-modal-${Math.random().toString(36).substring(7)}`;
				const { svg: modalSvg } = await mermaid.render(modalId, source);
				modalContainer.innerHTML = modalSvg;
			}
		} catch (err: any) {
			console.error('Failed to render Mermaid diagram:', err);
			error = err.message;
		}
	});
</script>

<div class="md-mermaid-container" class:rendered class:error>
	{#if error}
		<div class="md-mermaid-error">
			<p>Failed to render diagram: {error}</p>
			<details>
				<summary>Show source</summary>
				<pre>{Buffer.from(diagram, 'base64').toString('utf-8')}</pre>
			</details>
		</div>
	{:else if !rendered}
		<div class="md-mermaid-loading">
			<div class="md-mermaid-spinner"></div>
			<p>Rendering diagram...</p>
		</div>
	{/if}

	<div
		bind:this={container}
		class="md-mermaid-diagram"
		class:clickable={rendered && !error}
		onclick={openModal}
		role="button"
		tabindex={rendered && !error ? 0 : -1}
		onkeydown={(e) => e.key === 'Enter' && openModal()}
	></div>

	{#if rendered && !error}
		<div class="md-mermaid-hint">Click to expand</div>
	{/if}
</div>

<!-- Fullscreen Modal -->
{#if isModalOpen}
	<div
		class="md-mermaid-modal"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		onwheel={handleWheel}
		role="dialog"
		aria-modal="true"
		class:dragging={isDragging}
	>
		<button
			class="md-mermaid-modal-close"
			onclick={closeModal}
			aria-label="Close diagram"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>

		<!-- Zoom Controls -->
		<div class="md-mermaid-zoom-controls">
			<button
				class="md-mermaid-zoom-btn"
				onclick={zoomIn}
				aria-label="Zoom in"
				title="Zoom in"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="11" y1="8" x2="11" y2="14"></line>
					<line x1="8" y1="11" x2="14" y2="11"></line>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
			</button>
			<button
				class="md-mermaid-zoom-btn"
				onclick={zoomOut}
				aria-label="Zoom out"
				title="Zoom out"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="8" y1="11" x2="14" y2="11"></line>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
			</button>
			<button
				class="md-mermaid-zoom-btn"
				onclick={resetZoom}
				aria-label="Reset zoom"
				title="Reset zoom and pan"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
					<path d="M21 3v5h-5"></path>
					<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
					<path d="M3 21v-5h5"></path>
				</svg>
			</button>
			<div class="md-mermaid-zoom-level">{Math.round(zoom * 100)}%</div>
		</div>

		<div
			class="md-mermaid-modal-content"
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
		>
			<div
				bind:this={modalContainer}
				class="md-mermaid-modal-diagram"
				style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: center;"
			></div>
		</div>
	</div>
{/if}

<style>
	.md-mermaid-container {
		margin: var(--md-spacing-xl, 2rem) 0;
		padding: var(--md-spacing-lg, 1.5rem);
		background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
		border-radius: var(--md-radius-lg, 14px);
		overflow-x: auto;
		position: relative;
	}

	.md-mermaid-diagram {
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all 0.2s ease;
	}

	.md-mermaid-diagram.clickable {
		cursor: pointer;
	}

	.md-mermaid-diagram.clickable:hover {
		transform: scale(1.02);
		opacity: 0.9;
	}

	.md-mermaid-diagram.clickable:focus {
		outline: 2px solid var(--md-text-accent, rgb(0, 122, 255));
		outline-offset: 4px;
		border-radius: var(--md-radius-md, 10px);
	}

	.md-mermaid-diagram :global(svg) {
		max-width: 100%;
		height: auto;
	}

	.md-mermaid-diagram.clickable :global(svg) {
		pointer-events: none;
	}

	.md-mermaid-hint {
		text-align: center;
		margin-top: var(--md-spacing-sm, 0.5rem);
		font-size: var(--md-font-size-xs, 0.75rem);
		color: var(--md-text-tertiary, rgba(255, 255, 255, 0.5));
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.md-mermaid-container:hover .md-mermaid-hint {
		opacity: 1;
	}

	.md-mermaid-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--md-spacing-md, 1rem);
		padding: var(--md-spacing-2xl, 3rem);
		color: var(--md-text-secondary, rgba(255, 255, 255, 0.7));
	}

	.md-mermaid-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--md-border-subtle, rgba(255, 255, 255, 0.1));
		border-top-color: var(--md-text-accent, rgb(0, 122, 255));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.md-mermaid-error {
		padding: var(--md-spacing-lg, 1.5rem);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--md-radius-md, 10px);
		color: rgba(239, 68, 68, 0.9);
	}

	.md-mermaid-error p {
		margin: 0 0 var(--md-spacing-md, 1rem) 0;
		font-weight: var(--font-weight-medium, 500);
	}

	.md-mermaid-error details {
		margin-top: var(--md-spacing-md, 1rem);
	}

	.md-mermaid-error summary {
		cursor: pointer;
		font-size: var(--md-font-size-sm, 0.875rem);
		margin-bottom: var(--md-spacing-sm, 0.5rem);
	}

	.md-mermaid-error pre {
		background: rgba(0, 0, 0, 0.2);
		padding: var(--md-spacing-md, 1rem);
		border-radius: var(--md-radius-sm, 6px);
		overflow-x: auto;
		font-size: var(--md-font-size-sm, 0.875rem);
		font-family: var(--md-font-mono, monospace);
	}

	/* Modal styles */
	.md-mermaid-modal {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.95);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--md-spacing-2xl, 3rem);
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.md-mermaid-modal-content {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.md-mermaid-modal-diagram {
		/* Container that applies zoom/pan transform */
		/* Inline-block allows it to size to its SVG content */
		display: inline-block;
		max-width: 90vw;
		max-height: 85vh;
		/* Smooth transform for zoom/pan */
		transition: transform 0.1s ease-out;
		will-change: transform;
	}

	.md-mermaid-modal-diagram :global(svg) {
		/* Constrain SVG while preserving aspect ratio via viewBox */
		display: block;
		max-width: 100%;
		max-height: 100%;
		/* Scale up small diagrams to fill available space better */
		min-width: 600px;
		min-height: 400px;
		/* Mermaid's width/height attributes will be constrained by max-width/max-height */
		/* The viewBox attribute ensures proper aspect ratio scaling */
		pointer-events: none;
		user-select: none;
	}

	.md-mermaid-modal-close {
		position: fixed;
		top: var(--md-spacing-lg, 1.5rem);
		right: var(--md-spacing-lg, 1.5rem);
		width: 48px;
		height: 48px;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 50%;
		color: white;
		cursor: pointer !important;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		z-index: 10000;
	}

	.md-mermaid-modal-close:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.md-mermaid-modal-close:focus {
		outline: 2px solid white;
		outline-offset: 4px;
	}

	.md-mermaid-modal-close svg {
		width: 24px;
		height: 24px;
	}

	.md-mermaid-modal {
		cursor: grab;
	}

	.md-mermaid-modal.dragging {
		cursor: grabbing;
	}

	/* Zoom Controls */
	.md-mermaid-zoom-controls {
		position: fixed;
		bottom: var(--md-spacing-lg, 1.5rem);
		right: var(--md-spacing-lg, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: var(--md-spacing-sm, 0.5rem);
		z-index: 10000;
	}

	.md-mermaid-zoom-btn {
		width: 48px;
		height: 48px;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 50%;
		color: white;
		cursor: pointer !important;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.md-mermaid-zoom-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.md-mermaid-zoom-btn:focus {
		outline: 2px solid white;
		outline-offset: 4px;
	}

	.md-mermaid-zoom-btn svg {
		width: 20px;
		height: 20px;
	}

	.md-mermaid-zoom-level {
		padding: var(--md-spacing-sm, 0.5rem) var(--md-spacing-md, 1rem);
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: var(--md-radius-md, 10px);
		color: white;
		font-size: var(--md-font-size-sm, 0.875rem);
		font-family: var(--md-font-mono, monospace);
		text-align: center;
		user-select: none;
	}

</style>
