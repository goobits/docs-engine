<script lang="ts">
	/**
	 * Screenshot Component - Simple wrapper for use in markdown
	 *
	 * Usage in markdown:
	 * <Screenshot
	 *   name="sessions-list"
	 *   type="web"
	 *   url="http://localhost:3230/sessions"
	 *   viewport="1400x800"
	 * />
	 */
	import ScreenshotImage from './ScreenshotImage.svelte';

	interface Props {
		/** Unique name for the screenshot (e.g., "sessions-list") */
		name: string;
		/** Type of screenshot: "web" or "cli" */
		type?: 'web' | 'cli';
		/** URL to capture (for web screenshots) */
		url?: string;
		/** Command to execute (for CLI screenshots) */
		command?: string;
		/** Viewport size (e.g., "1400x800") */
		viewport?: string;
		/** Theme for CLI screenshots (dracula, nord, monokai, solarized) */
		theme?: string;
		/** Show command prompt for CLI screenshots */
		showPrompt?: boolean;
		/** Custom prompt text for CLI screenshots */
		promptText?: string;
		/** CSS selector to capture (for web screenshots) */
		selector?: string;
		/** Wait for selector before capturing (for web screenshots) */
		waitFor?: string;
		/** Screenshot version (defaults to 1.0.0) */
		version?: string;
	}

	let {
		name,
		type = 'web',
		url = '',
		command = '',
		viewport = '1400x800',
		theme = 'dracula',
		showPrompt = true,
		promptText = '$',
		selector,
		waitFor,
		version = '1.0.0'
	}: Props = $props();

	// Build config object
	const config = {
		type,
		...(type === 'web' && { url, selector, waitFor }),
		...(type === 'cli' && { command, theme, showPrompt, promptText }),
		viewport
	};

	// Build path
	const path = `/screenshots/v${version}/${name}.png`;
</script>

<ScreenshotImage {name} {url} {path} {version} {config} />
