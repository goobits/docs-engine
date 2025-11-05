<script lang="ts">
	/**
	 * Edit This Page Component
	 *
	 * Displays a link to edit the current page on the Git provider (GitHub/GitLab/Gitea).
	 * Helps encourage open-source contributions.
	 */

	import { ExternalLink, Pencil } from 'lucide-svelte';

	interface Props {
		/** URL to the edit page on the Git provider */
		href: string;
		/** Link text (default: "Edit this page") */
		text?: string;
	}

	let { href, text = 'Edit this page' }: Props = $props();
</script>

<a
	{href}
	class="edit-this-page"
	target="_blank"
	rel="noopener noreferrer"
	aria-label={text}
>
	<Pencil size={16} />
	<span class="edit-this-page-text">{text}</span>
	<ExternalLink size={14} class="edit-this-page-external" />
</a>

<style>
	.edit-this-page {
		display: inline-flex;
		align-items: center;
		gap: var(--docs-spacing-sm, 0.5rem);
		padding: var(--docs-spacing-sm, 0.5rem) var(--docs-spacing-md, 1rem);
		background: var(--docs-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		border-radius: var(--docs-radius-md, 10px);
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.edit-this-page:hover {
		background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--docs-accent, #bd93f9);
		color: var(--docs-accent, #bd93f9);
		transform: translateY(-1px);
	}

	.edit-this-page:focus-visible {
		outline: 2px solid var(--docs-accent, #bd93f9);
		outline-offset: 2px;
	}

	.edit-this-page-text {
		line-height: 1;
	}

	.edit-this-page :global(.edit-this-page-external) {
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.edit-this-page:hover :global(.edit-this-page-external) {
		opacity: 1;
	}
</style>
