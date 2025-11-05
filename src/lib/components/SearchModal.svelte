<script lang="ts">
	/**
	 * Cmd+K Search Modal Component
	 *
	 * Provides instant, keyboard-driven search across all documentation pages.
	 * Features fuzzy matching, keyboard navigation, and result highlighting.
	 */

	import { onMount, onDestroy } from 'svelte';
	import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft, X } from '@lucide/svelte';
	import type MiniSearch from 'minisearch';
	import { loadSearchIndex, performSearch, highlightMatches } from '../utils/search-index';
	import type { SearchResult } from '../utils/search-index';

	interface Props {
		/** Serialized search index JSON */
		searchIndex?: string;
		/** Placeholder text for search input */
		placeholder?: string;
	}

	let { searchIndex, placeholder = 'Search documentation...' }: Props = $props();

	// State
	let isOpen = $state(false);
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let selectedIndex = $state(0);
	let isLoading = $state(false);
	let miniSearch: MiniSearch | null = $state(null);

	// Debounce timer
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Handle search query changes with debouncing
	$effect(() => {
		if (!query.trim() || !miniSearch) {
			results = [];
			selectedIndex = 0;
			return;
		}

		// Clear previous timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Debounce search
		debounceTimer = setTimeout(() => {
			results = performSearch(miniSearch!, query);
			selectedIndex = 0;
		}, 200);

		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});

	// Handle keyboard shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		// Open modal with Cmd+K or Ctrl+K
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			openModal();
			return;
		}

		// Close modal with Escape
		if (e.key === 'Escape' && isOpen) {
			e.preventDefault();
			closeModal();
			return;
		}

		// Navigate results with arrow keys
		if (isOpen && results.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % results.length;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + results.length) % results.length;
			} else if (e.key === 'Enter') {
				e.preventDefault();
				if (results[selectedIndex]) {
					navigateToResult(results[selectedIndex]);
				}
			}
		}
	}

	async function openModal() {
		isOpen = true;
		query = '';
		results = [];
		selectedIndex = 0;

		// Lazy load search index
		if (!miniSearch && searchIndex) {
			isLoading = true;
			try {
				// Simulate async loading
				await new Promise(resolve => setTimeout(resolve, 0));
				miniSearch = loadSearchIndex(searchIndex);
			} catch (error) {
				console.error('Failed to load search index:', error);
			} finally {
				isLoading = false;
			}
		}

		// Focus search input
		setTimeout(() => {
			const input = document.querySelector('.search-modal-input') as HTMLInputElement;
			input?.focus();
		}, 50);
	}

	function closeModal() {
		isOpen = false;
		query = '';
		results = [];
		selectedIndex = 0;
	}

	function navigateToResult(result: SearchResult) {
		closeModal();
		window.location.href = result.href;
	}

	function handleResultClick(result: SearchResult) {
		navigateToResult(result);
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeyDown);
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
	});
</script>

<!-- Trigger Button -->
<button class="search-trigger" onclick={openModal} type="button" aria-label="Search documentation">
	<Search size={18} />
	<span class="search-trigger-text">Search...</span>
	<kbd class="search-trigger-kbd">
		<Command size={12} />
		<span>K</span>
	</kbd>
</button>

<!-- Modal -->
{#if isOpen}
	<div class="search-modal-overlay" onclick={closeModal}></div>
	<div class="search-modal">
		<!-- Search Input -->
		<div class="search-modal-header">
			<Search size={20} class="search-modal-icon" />
			<input
				bind:value={query}
				class="search-modal-input"
				type="text"
				{placeholder}
				autocomplete="off"
				spellcheck="false"
			/>
			<button
				class="search-modal-close"
				onclick={closeModal}
				type="button"
				aria-label="Close search"
			>
				<X size={20} />
			</button>
		</div>

		<!-- Results -->
		<div class="search-modal-results">
			{#if isLoading}
				<div class="search-modal-loading">Loading search index...</div>
			{:else if query.trim() && results.length === 0}
				<div class="search-modal-empty">
					<p>No results found for "{query}"</p>
					<p class="search-modal-empty-hint">Try a different search term</p>
				</div>
			{:else if results.length > 0}
				{#each results as result, index (result.id)}
					<button
						class="search-result {index === selectedIndex ? 'selected' : ''}"
						onclick={() => handleResultClick(result)}
						type="button"
					>
						<div class="search-result-content">
							<div class="search-result-section">{result.section}</div>
							<div class="search-result-title">
								{@html highlightMatches(result.title, query)}
							</div>
							{#if result.match.excerpt}
								<div class="search-result-excerpt">
									{@html highlightMatches(result.match.excerpt, query)}
								</div>
							{/if}
						</div>
						{#if index === selectedIndex}
							<CornerDownLeft size={16} class="search-result-enter-icon" />
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Footer with keyboard hints -->
		<div class="search-modal-footer">
			<div class="search-modal-hint">
				<kbd><ArrowUp size={12} /></kbd>
				<kbd><ArrowDown size={12} /></kbd>
				<span>Navigate</span>
			</div>
			<div class="search-modal-hint">
				<kbd><CornerDownLeft size={12} /></kbd>
				<span>Select</span>
			</div>
			<div class="search-modal-hint">
				<kbd>ESC</kbd>
				<span>Close</span>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Trigger Button */
	.search-trigger {
		display: flex;
		align-items: center;
		gap: var(--docs-spacing-sm, 0.5rem);
		padding: var(--docs-spacing-sm, 0.5rem) var(--docs-spacing-md, 1rem);
		background: var(--docs-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		border-radius: var(--docs-radius-md, 10px);
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		min-width: 240px;
	}

	.search-trigger:hover {
		background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--docs-accent, #bd93f9);
	}

	.search-trigger-text {
		flex: 1;
		text-align: left;
	}

	.search-trigger-kbd {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 2px 6px;
		background: var(--docs-surface-raised, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Modal Overlay */
	.search-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		z-index: 9998;
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

	/* Modal */
	.search-modal {
		position: fixed;
		top: 15vh;
		left: 50%;
		transform: translateX(-50%);
		width: 90%;
		max-width: 640px;
		max-height: 60vh;
		background: var(--docs-surface-raised, rgba(255, 255, 255, 0.06));
		backdrop-filter: blur(20px);
		border: 1px solid var(--docs-border-medium, rgba(255, 255, 255, 0.12));
		border-radius: var(--docs-radius-lg, 14px);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Header */
	.search-modal-header {
		display: flex;
		align-items: center;
		gap: var(--docs-spacing-md, 1rem);
		padding: var(--docs-spacing-lg, 1.5rem);
		border-bottom: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
	}

	.search-modal-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--docs-text, #f8f8f2);
		font-size: 1.125rem;
		font-weight: 500;
	}

	.search-modal-input::placeholder {
		color: var(--docs-text-tertiary, rgba(248, 248, 242, 0.5));
	}

	.search-modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--docs-spacing-sm, 0.5rem);
		background: transparent;
		border: none;
		border-radius: var(--docs-radius-sm, 6px);
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.search-modal-close:hover {
		background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
		color: var(--docs-text, #f8f8f2);
	}

	/* Results */
	.search-modal-results {
		flex: 1;
		overflow-y: auto;
		padding: var(--docs-spacing-sm, 0.5rem);
	}

	.search-modal-loading,
	.search-modal-empty {
		padding: var(--docs-spacing-2xl, 3rem);
		text-align: center;
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
	}

	.search-modal-empty-hint {
		margin-top: var(--docs-spacing-sm, 0.5rem);
		font-size: 0.875rem;
		color: var(--docs-text-tertiary, rgba(248, 248, 242, 0.5));
	}

	.search-result {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--docs-spacing-md, 1rem);
		width: 100%;
		padding: var(--docs-spacing-md, 1rem);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--docs-radius-md, 10px);
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: var(--docs-spacing-xs, 0.25rem);
	}

	.search-result:hover,
	.search-result.selected {
		background: var(--docs-surface-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--docs-accent, #bd93f9);
	}

	.search-result-content {
		flex: 1;
		min-width: 0;
	}

	.search-result-section {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--docs-accent-tertiary, #8be9fd);
		margin-bottom: var(--docs-spacing-xs, 0.25rem);
	}

	.search-result-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--docs-text, #f8f8f2);
		margin-bottom: var(--docs-spacing-xs, 0.25rem);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-result-excerpt {
		font-size: 0.875rem;
		color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.search-result :global(mark) {
		background: var(--docs-accent, #bd93f9);
		color: var(--docs-bg, #282a36);
		padding: 0 2px;
		border-radius: 2px;
		font-weight: 600;
	}

	/* Footer */
	.search-modal-footer {
		display: flex;
		align-items: center;
		gap: var(--docs-spacing-lg, 1.5rem);
		padding: var(--docs-spacing-md, 1rem) var(--docs-spacing-lg, 1.5rem);
		border-top: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		font-size: 0.75rem;
		color: var(--docs-text-tertiary, rgba(248, 248, 242, 0.5));
	}

	.search-modal-hint {
		display: flex;
		align-items: center;
		gap: var(--docs-spacing-xs, 0.25rem);
	}

	.search-modal-hint kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 4px;
		background: var(--docs-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		font-family: ui-monospace, monospace;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.search-modal {
			top: 10vh;
			max-height: 70vh;
		}

		.search-trigger {
			min-width: auto;
		}

		.search-trigger-text {
			display: none;
		}
	}
</style>
