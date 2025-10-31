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

	function openModal() {
		if (!error && rendered) {
			isModalOpen = true;
		}
	}

	function closeModal() {
		isModalOpen = false;
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
		role="dialog"
		aria-modal="true"
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
		<div class="md-mermaid-modal-content">
			<div bind:this={modalContainer} class="md-mermaid-modal-diagram"></div>
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
		max-width: 95vw;
		max-height: 95vh;
		overflow: auto;
		position: relative;
	}

	.md-mermaid-modal-diagram {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.md-mermaid-modal-diagram :global(svg) {
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 90vh;
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
		cursor: pointer;
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
</style>
