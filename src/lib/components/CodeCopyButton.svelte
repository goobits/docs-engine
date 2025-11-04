<script lang="ts">
	/**
	 * Copy button for code blocks
	 *
	 * Displays a floating button that copies code to clipboard
	 * Shows feedback when copied
	 */

	interface Props {
		/** The code to copy */
		code: string;
		/** Language for display (optional) */
		language?: string;
		/** Theme (optional) */
		theme?: string;
	}

	let { code, language, theme = 'dracula' }: Props = $props();

	let copied = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;

			// Clear any existing timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// Reset after 2 seconds
			timeoutId = setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy code:', err);
		}
	}
</script>

<button
	class="code-copy-button"
	onclick={handleCopy}
	title={copied ? 'Copied!' : 'Copy code'}
	aria-label={copied ? 'Copied!' : 'Copy code'}
>
	{#if copied}
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="copy-icon"
		>
			<path
				d="M13.5 4.5L6 12L2.5 8.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span class="copy-text">Copied!</span>
	{:else}
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="copy-icon"
		>
			<path
				d="M5.5 2.5h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
				stroke="currentColor"
				stroke-width="1.5"
			/>
			<path
				d="M3.5 5.5h-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1"
				stroke="currentColor"
				stroke-width="1.5"
			/>
		</svg>
		<span class="copy-text">Copy</span>
	{/if}
</button>

<style>
	.code-copy-button {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		background: rgba(40, 42, 54, 0.8);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(189, 147, 249, 0.3);
		border-radius: 6px;
		color: #bd93f9;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.75rem;
		font-family: var(--v2-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif);
		font-weight: 500;
		z-index: 10;
	}

	.code-copy-button:hover {
		background: rgba(40, 42, 54, 0.95);
		border-color: #bd93f9;
		transform: translateY(-1px);
	}

	.code-copy-button:active {
		transform: translateY(0);
	}

	.code-copy-button:focus {
		outline: 2px solid #bd93f9;
		outline-offset: 2px;
	}

	.copy-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.copy-text {
		white-space: nowrap;
	}

	/* Success state styling */
	.code-copy-button:has(svg path[d*="13.5 4.5"]) {
		color: #50fa7b;
		border-color: rgba(80, 250, 123, 0.5);
	}

	.code-copy-button:has(svg path[d*="13.5 4.5"]):hover {
		border-color: #50fa7b;
	}
</style>
