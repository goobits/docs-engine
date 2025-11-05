<script lang="ts">
	/**
	 * Previous/Next Page Navigation Component
	 *
	 * Displays navigation links to previous and next pages based on sidebar order.
	 * Shows page titles and descriptions in clickable card-style buttons.
	 */

	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { DocsLink } from '../utils/navigation.js';

	interface Props {
		previous?: (DocsLink & { section: string }) | null;
		next?: (DocsLink & { section: string }) | null;
	}

	let { previous = null, next = null }: Props = $props();
</script>

{#if previous || next}
	<nav class="docs-prev-next" aria-label="Page navigation">
		<div class="docs-prev-next-container">
			{#if previous}
				<a href={previous.href} class="docs-prev-next-link prev">
					<div class="docs-prev-next-icon">
						<ChevronLeft size={20} />
					</div>
					<div class="docs-prev-next-content">
						<span class="docs-prev-next-label">Previous</span>
						<span class="docs-prev-next-title">{previous.title}</span>
						{#if previous.description}
							<span class="docs-prev-next-description">{previous.description}</span>
						{/if}
					</div>
				</a>
			{:else}
				<div></div>
			{/if}

			{#if next}
				<a href={next.href} class="docs-prev-next-link next">
					<div class="docs-prev-next-content">
						<span class="docs-prev-next-label">Next</span>
						<span class="docs-prev-next-title">{next.title}</span>
						{#if next.description}
							<span class="docs-prev-next-description">{next.description}</span>
						{/if}
					</div>
					<div class="docs-prev-next-icon">
						<ChevronRight size={20} />
					</div>
				</a>
			{/if}
		</div>
	</nav>
{/if}

<style>
	.docs-prev-next {
		margin-top: var(--docs-spacing-2xl, 3rem);
		padding-top: var(--docs-spacing-2xl, 3rem);
		border-top: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
	}

	.docs-prev-next-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--docs-spacing-lg, 1.5rem);
	}

	.docs-prev-next-link {
		display: flex;
		align-items: center;
		gap: var(--docs-spacing-md, 1rem);
		padding: var(--docs-spacing-lg, 1.5rem);
		background: var(--docs-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		border-radius: var(--docs-radius-lg, 14px);
		text-decoration: none;
		transition: all 0.2s ease;
		min-height: 100px;
	}

	.docs-prev-next-link:hover {
		background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--docs-accent, #bd93f9);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.docs-prev-next-link:focus-visible {
		outline: 2px solid var(--docs-accent, #bd93f9);
		outline-offset: 2px;
	}

	.docs-prev-next-link.prev {
		justify-content: flex-start;
	}

	.docs-prev-next-link.next {
		justify-content: flex-end;
	}

	.docs-prev-next-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--docs-radius-md, 10px);
		background: var(--docs-surface-raised, rgba(255, 255, 255, 0.06));
		color: var(--docs-accent, #bd93f9);
		flex-shrink: 0;
		transition: all 0.2s ease;
	}

	.docs-prev-next-link:hover .docs-prev-next-icon {
		background: var(--docs-accent, #bd93f9);
		color: var(--docs-bg, #282a36);
	}

	.docs-prev-next-content {
		display: flex;
		flex-direction: column;
		gap: var(--docs-spacing-xs, 0.25rem);
		min-width: 0;
	}

	.docs-prev-next-link.prev .docs-prev-next-content {
		align-items: flex-start;
		text-align: left;
	}

	.docs-prev-next-link.next .docs-prev-next-content {
		align-items: flex-end;
		text-align: right;
	}

	.docs-prev-next-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
	}

	.docs-prev-next-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--docs-text, #f8f8f2);
		line-height: 1.4;
		word-break: break-word;
	}

	.docs-prev-next-description {
		font-size: 0.875rem;
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.docs-prev-next-container {
			grid-template-columns: 1fr;
			gap: var(--docs-spacing-md, 1rem);
		}

		.docs-prev-next-link.next {
			justify-content: flex-start;
		}

		.docs-prev-next-link.next .docs-prev-next-content {
			align-items: flex-start;
			text-align: left;
		}

		.docs-prev-next-link {
			min-height: 80px;
			padding: var(--docs-spacing-md, 1rem);
		}
	}
</style>
