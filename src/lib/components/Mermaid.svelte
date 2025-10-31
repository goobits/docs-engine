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
	let rendered = $state(false);
	let error = $state('');

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

			// Generate unique ID
			const id = `mermaid-${Math.random().toString(36).substring(7)}`;

			// Render diagram
			const { svg } = await mermaid.render(id, source);

			if (container) {
				container.innerHTML = svg;
				rendered = true;
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

	<div bind:this={container} class="md-mermaid-diagram"></div>
</div>

<style>
	.md-mermaid-container {
		margin: var(--md-spacing-xl, 2rem) 0;
		padding: var(--md-spacing-lg, 1.5rem);
		background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
		border-radius: var(--md-radius-lg, 14px);
		overflow-x: auto;
	}

	.md-mermaid-diagram {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.md-mermaid-diagram :global(svg) {
		max-width: 100%;
		height: auto;
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
</style>
