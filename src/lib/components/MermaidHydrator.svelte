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
	let modalOpen = $state(false);
	let modalSvg = $state('');

	function openModal(svg: string) {
		modalSvg = svg;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		modalSvg = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeModal();
		}
	}

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

					// Wrap SVG in clickable container
					const wrapper = document.createElement('div');
					wrapper.className = 'md-mermaid-clickable';
					wrapper.innerHTML = svg;
					wrapper.style.cursor = 'pointer';
					wrapper.style.transition = 'all 0.2s ease';
					wrapper.setAttribute('role', 'button');
					wrapper.setAttribute('tabindex', '0');

					// Add click handler
					wrapper.addEventListener('click', () => openModal(svg));
					wrapper.addEventListener('keydown', (e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							openModal(svg);
						}
					});
					wrapper.addEventListener('mouseenter', () => {
						wrapper.style.transform = 'scale(1.02)';
						wrapper.style.opacity = '0.9';
					});
					wrapper.addEventListener('mouseleave', () => {
						wrapper.style.transform = 'scale(1)';
						wrapper.style.opacity = '1';
					});

					element.innerHTML = '';
					element.appendChild(wrapper);

					// Add hint
					const hint = document.createElement('div');
					hint.className = 'md-mermaid-hint';
					hint.textContent = 'Click to expand';
					hint.style.cssText = 'text-align: center; margin-top: 0.5rem; font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); opacity: 0; transition: opacity 0.2s ease;';
					element.appendChild(hint);

					element.addEventListener('mouseenter', () => {
						hint.style.opacity = '1';
					});
					element.addEventListener('mouseleave', () => {
						hint.style.opacity = '0';
					});

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

<!-- Fullscreen Modal -->
{#if modalOpen}
	<div
		class="md-mermaid-modal"
		onclick={(e) => e.target === e.currentTarget && closeModal()}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
	>
		<button class="md-mermaid-modal-close" onclick={closeModal} aria-label="Close diagram">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
		<div class="md-mermaid-modal-content">
			<div class="md-mermaid-modal-diagram">
				{@html modalSvg}
			</div>
		</div>
	</div>
{/if}

<style>
	.md-mermaid-modal {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.95);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem;
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
		top: 1.5rem;
		right: 1.5rem;
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
