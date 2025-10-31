<script lang="ts">
	/**
	 * Client-side hydrator for mermaid diagrams
	 *
	 * Finds all .md-mermaid divs and renders them
	 * Use this in your layout or page to hydrate static HTML
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';

	interface Props {
		theme?: 'default' | 'dark' | 'forest' | 'neutral';
	}

	let { theme = 'dark' }: Props = $props();

	let mermaidApi: typeof import('mermaid').default | undefined;
	let initialized = false;

	async function renderDiagrams() {
		try {
			if (!mermaidApi) {
				const mermaidModule = await import('mermaid');
				mermaidApi = mermaidModule.default;

				if (!mermaidApi) {
					console.error('Mermaid module loaded but default export is undefined');
					return;
				}
			}

			if (!initialized) {
				mermaidApi.initialize({
					startOnLoad: false,
					theme: theme,
					themeVariables: {
						primaryColor: '#bd93f9',
						primaryTextColor: '#f8f8f2',
						primaryBorderColor: '#6272a4',
						lineColor: '#8be9fd',
						secondaryColor: '#ff79c6',
						tertiaryColor: '#50fa7b',
						background: '#282a36',
						mainBkg: '#282a36',
						textColor: '#f8f8f2',
						fontSize: '16px',
						fontFamily: 'var(--v2-font-mono, ui-monospace, monospace)'
					},
					securityLevel: 'loose',
					logLevel: 'error'
				});
				initialized = true;
			}

			const diagrams = document.querySelectorAll('.md-mermaid[data-diagram]');

			for (const element of diagrams) {
				const encoded = element.getAttribute('data-diagram');
				if (!encoded) {
					console.warn('Mermaid element missing data-diagram attribute');
					continue;
				}

				try {
					const source = atob(encoded);
					const id = `mermaid-${Math.random().toString(36).substring(7)}`;

					const { svg } = await mermaidApi.render(id, source);
					element.innerHTML = svg;
					element.classList.add('md-mermaid--rendered');
					element.removeAttribute('data-diagram');
				} catch (err) {
					console.error('Failed to render mermaid diagram:', err);
					element.innerHTML = `<div class="md-mermaid-error" style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
						<strong>Failed to render diagram</strong>
						<pre style="margin-top: 0.5rem; font-size: 0.875rem; overflow-x: auto;">${err instanceof Error ? err.message : String(err)}</pre>
					</div>`;
				}
			}
		} catch (err) {
			console.error('Failed to load mermaid:', err);
			const diagrams = document.querySelectorAll('.md-mermaid[data-diagram]');
			if (diagrams.length > 0) {
				for (const element of diagrams) {
					element.innerHTML = `<div class="md-mermaid-error" style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
						<strong>Mermaid library not available</strong>
						<p style="margin-top: 0.5rem;">The mermaid package needs to be installed. Run: <code>bun add mermaid</code></p>
					</div>`;
				}
			}
		}
	}

	function hydrate() {
		requestAnimationFrame(() => {
			void renderDiagrams();
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
