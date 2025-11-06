<script lang="ts">
	/**
	 * Client-side hydrator for collapsible sections
	 * Adds animations and accessibility to native <details> elements
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';

	function hydrate() {
		requestAnimationFrame(() => {
			try {
				const elements = document.querySelectorAll('details.md-collapse:not([data-hydrated])');

				for (const element of elements) {
					const details = element as HTMLDetailsElement;
					const summary = details.querySelector('.md-collapse__summary') as HTMLElement;
					const content = details.querySelector('.md-collapse__content') as HTMLElement;

					if (!summary || !content) continue;

					// Add aria-expanded for accessibility
					summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');

					// Update aria-expanded on toggle
					details.addEventListener('toggle', () => {
						summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
					});

					// Mark as hydrated to prevent re-processing
					details.setAttribute('data-hydrated', 'true');
				}
			} catch (err) {
				console.error('[CollapseHydrator] Fatal error:', err);
			}
		});
	}

	onMount(() => {
		if (!browser) return;

		const unsubscribe = afterNavigate(() => hydrate());
		// Defer hydration to avoid conflicts with Svelte's hydration phase
		queueMicrotask(() => {
			requestAnimationFrame(hydrate);
		});

		return () => {
			unsubscribe?.();
		};
	});
</script>

<style>
	:global(.md-collapse) {
		border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		border-radius: var(--docs-radius-md, 10px);
		background: var(--docs-surface, rgba(255, 255, 255, 0.03));
		margin: var(--docs-spacing-lg, 1.5rem) 0;
		overflow: hidden;
	}

	:global(.md-collapse__summary) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: var(--docs-spacing-md, 1rem);
		cursor: pointer;
		user-select: none;
		font-weight: 600;
		color: var(--docs-accent, #bd93f9);
		transition: all 0.2s ease;
		list-style: none; /* Remove default triangle */
	}

	:global(.md-collapse__summary::-webkit-details-marker) {
		display: none; /* Hide default marker in WebKit */
	}

	:global(.md-collapse__summary:hover) {
		background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
	}

	:global(.md-collapse__icon) {
		flex-shrink: 0;
		transition: transform 0.2s ease;
		color: var(--docs-accent, #bd93f9);
	}

	:global(.md-collapse[open] .md-collapse__icon) {
		transform: rotate(90deg);
	}

	:global(.md-collapse__title) {
		flex: 1;
	}

	:global(.md-collapse__content) {
		padding: 0 var(--docs-spacing-lg, 1.5rem) var(--docs-spacing-lg, 1.5rem);
		color: var(--docs-text, #f8f8f2);
	}

	/* Nested content styling */
	:global(.md-collapse__content > :first-child) {
		margin-top: 0;
	}

	:global(.md-collapse__content > :last-child) {
		margin-bottom: 0;
	}
</style>
