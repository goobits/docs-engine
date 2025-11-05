<script lang="ts">
	/**
	 * Generic Docs Layout Component
	 *
	 * Provides a complete documentation layout with:
	 * - Responsive sidebar with mobile menu
	 * - Breadcrumb navigation
	 * - Content prose styling
	 * - Footer with optional edit link
	 * - Automatic hydration of markdown components
	 */

	import { Menu, X } from '@lucide/svelte';
	import DocsSidebar from './DocsSidebar.svelte';
	import CodeTabsHydrator from './CodeTabsHydrator.svelte';
	import CodeCopyHydrator from './CodeCopyHydrator.svelte';
	import FileTreeHydrator from './FileTreeHydrator.svelte';
	import MermaidHydrator from './MermaidHydrator.svelte';
	import ScreenshotHydrator from './ScreenshotHydrator.svelte';
	import OpenAPIHydrator from './OpenAPIHydrator.svelte';
	import CollapseHydrator from './CollapseHydrator.svelte';
	import type { DocsSection } from './types';

	interface BreadcrumbItem {
		label: string;
		href: string;
		icon?: any; // Svelte component constructor
	}

	interface FooterConfig {
		text?: string;
		editLink?: {
			text: string;
			url: string;
		};
		lastModified?: string | null;
	}

	interface HydratorsConfig {
		codeTabs?: boolean;
		codeCopy?: boolean;
		fileTree?: boolean;
		mermaid?: boolean;
		screenshot?: boolean;
		openapi?: boolean;
		collapse?: boolean;
	}

	interface Props {
		// Required
		content: string;
		title: string;

		// Navigation
		navigation?: DocsSection[];
		currentPath?: string;

		// Customization
		breadcrumbs?: BreadcrumbItem[];
		footer?: FooterConfig;
		theme?: 'dracula' | 'github' | 'minimal';

		// Hydrators - all enabled by default
		hydrators?: HydratorsConfig;
	}

	let {
		content,
		title,
		navigation = [],
		currentPath = '',
		breadcrumbs = [],
		footer,
		theme = 'dracula',
		hydrators = {}
	}: Props = $props();

	// Hydrator defaults
	const enableCodeTabs = $derived(hydrators.codeTabs !== false);
	const enableCodeCopy = $derived(hydrators.codeCopy !== false);
	const enableFileTree = $derived(hydrators.fileTree !== false);
	const enableMermaid = $derived(hydrators.mermaid !== false);
	const enableScreenshot = $derived(hydrators.screenshot !== false);
	const enableOpenAPI = $derived(hydrators.openapi !== false);
	const enableCollapse = $derived(hydrators.collapse !== false);

	// Mobile sidebar state
	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<div class="docs-layout" data-theme={theme}>
	<!-- Mobile Menu Toggle -->
	<button
		class="docs-mobile-toggle"
		onclick={toggleMobileMenu}
		type="button"
		aria-label="Toggle menu"
	>
		{#if mobileMenuOpen}
			<X size={20} />
		{:else}
			<Menu size={20} />
		{/if}
	</button>

	<!-- Sidebar -->
	<div class="docs-sidebar-container {mobileMenuOpen ? 'mobile-open' : ''}">
		{#if navigation.length > 0}
			<DocsSidebar {navigation} {currentPath} />
		{/if}
	</div>

	<!-- Overlay for mobile -->
	{#if mobileMenuOpen}
		<button class="docs-overlay" onclick={closeMobileMenu} type="button" aria-label="Close menu"
		></button>
	{/if}

	<!-- Main Content Area -->
	<div class="docs-main">
		<!-- Breadcrumbs -->
		{#if breadcrumbs.length > 0}
			<nav class="docs-breadcrumbs" aria-label="Breadcrumb">
				{#each breadcrumbs as crumb, i (crumb.href)}
					{#if i > 0}
						<span class="docs-breadcrumb-sep">/</span>
					{/if}
					<a href={crumb.href} class="docs-breadcrumb">
						{#if crumb.icon}
							<svelte:component this={crumb.icon} size={16} />
						{/if}
						{crumb.label}
					</a>
				{/each}
			</nav>
		{/if}

		<!-- Content -->
		<div class="docs-content">
			<article class="docs-prose">
				{@html content}
			</article>
		</div>

		<!-- Hydrate markdown components -->
		{#if enableCodeTabs}
			<CodeTabsHydrator theme={theme === 'dracula' ? 'dracula' : 'github-dark'} />
		{/if}
		{#if enableCodeCopy}
			<CodeCopyHydrator theme={theme === 'dracula' ? 'dracula' : 'github-dark'} />
		{/if}
		{#if enableFileTree}
			<FileTreeHydrator allowCopy={true} />
		{/if}
		{#if enableMermaid}
			<MermaidHydrator theme={theme === 'dracula' ? 'dark' : 'default'} />
		{/if}
		{#if enableScreenshot}
			<ScreenshotHydrator />
		{/if}
		{#if enableOpenAPI}
			<OpenAPIHydrator theme={theme === 'dracula' ? 'dracula' : 'github-dark'} />
		{/if}
		{#if enableCollapse}
			<CollapseHydrator />
		{/if}

		<!-- Footer -->
		{#if footer}
			<footer class="docs-footer">
				{#if footer.text}
					<p class="docs-footer-text">{footer.text}</p>
				{/if}
				{#if footer.editLink}
					<a
						href={footer.editLink.url}
						class="docs-footer-link"
						target="_blank"
						rel="noopener noreferrer"
					>
						{footer.editLink.text}
					</a>
				{/if}
				{#if footer.lastModified}
					<p class="docs-footer-last-modified">Last modified: {footer.lastModified}</p>
				{/if}
			</footer>
		{/if}
	</div>
</div>

<style>
	/* === Base Layout === */
	.docs-layout {
		/* Full viewport minus header - parent layout handles padding removal */
		height: calc(100vh - var(--header-height, 70px));
		overflow: hidden;
		display: grid;
		grid-template-columns: auto 1fr;
		position: relative;

		/* Default theme variables (dracula) */
		--docs-bg: #282a36;
		--docs-text: #f8f8f2;
		--docs-text-secondary: rgba(248, 248, 242, 0.7);
		--docs-text-tertiary: rgba(248, 248, 242, 0.5);
		--docs-accent: #bd93f9;
		--docs-accent-secondary: #ff79c6;
		--docs-accent-tertiary: #8be9fd;
		--docs-surface: rgba(255, 255, 255, 0.03);
		--docs-surface-raised: rgba(255, 255, 255, 0.06);
		--docs-surface-hover: rgba(255, 255, 255, 0.08);
		--docs-border: rgba(255, 255, 255, 0.06);
		--docs-border-medium: rgba(255, 255, 255, 0.12);
		--docs-radius-sm: 6px;
		--docs-radius-md: 10px;
		--docs-radius-lg: 14px;
		--docs-spacing-xs: 0.25rem;
		--docs-spacing-sm: 0.5rem;
		--docs-spacing-md: 1rem;
		--docs-spacing-lg: 1.5rem;
		--docs-spacing-xl: 2rem;
		--docs-spacing-2xl: 3rem;
	}

	/* GitHub theme */
	.docs-layout[data-theme="github"] {
		--docs-bg: #ffffff;
		--docs-text: #24292f;
		--docs-text-secondary: #57606a;
		--docs-text-tertiary: #8c959f;
		--docs-accent: #0969da;
		--docs-accent-secondary: #8250df;
		--docs-accent-tertiary: #1f883d;
		--docs-surface: #f6f8fa;
		--docs-surface-raised: #ffffff;
		--docs-surface-hover: #eaeef2;
		--docs-border: #d0d7de;
		--docs-border-medium: #d0d7de;
	}

	/* Minimal theme */
	.docs-layout[data-theme="minimal"] {
		--docs-bg: #ffffff;
		--docs-text: #1a1a1a;
		--docs-text-secondary: #666666;
		--docs-text-tertiary: #999999;
		--docs-accent: #0066cc;
		--docs-accent-secondary: #cc0066;
		--docs-accent-tertiary: #00cc66;
		--docs-surface: #f5f5f5;
		--docs-surface-raised: #ffffff;
		--docs-surface-hover: #e8e8e8;
		--docs-border: #e0e0e0;
		--docs-border-medium: #cccccc;
	}

	/* Mobile Menu Toggle */
	.docs-mobile-toggle {
		display: none;
		position: fixed;
		top: var(--docs-spacing-lg);
		left: var(--docs-spacing-lg);
		z-index: 1001;
		padding: var(--docs-spacing-sm);
		background: var(--docs-surface-raised);
		backdrop-filter: blur(10px);
		border: 1px solid var(--docs-border-medium);
		border-radius: var(--docs-radius-md);
		color: var(--docs-text);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.docs-mobile-toggle:hover {
		background: var(--docs-surface-hover);
		border-color: var(--docs-accent);
	}

	/* Sidebar Container */
	.docs-sidebar-container {
		height: calc(100vh - var(--header-height, 70px));
		overflow-y: auto;
		padding: var(--docs-spacing-md) 0;
	}

	/* Mobile Overlay */
	.docs-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 999;
		cursor: pointer;
		border: none;
	}

	/* Main Content */
	.docs-main {
		display: flex;
		flex-direction: column;
		gap: var(--docs-spacing-xl);
		padding: var(--docs-spacing-2xl);
		max-width: 900px;
		height: calc(100vh - var(--header-height, 70px));
		overflow-y: auto;
	}

	/* Breadcrumbs */
	.docs-breadcrumbs {
		display: flex;
		align-items: center;
		gap: var(--docs-spacing-sm);
		flex-wrap: wrap;
	}

	.docs-breadcrumb {
		display: inline-flex;
		align-items: center;
		gap: var(--docs-spacing-xs);
		padding: var(--docs-spacing-xs) var(--docs-spacing-sm);
		color: var(--docs-text-secondary);
		text-decoration: none;
		border-radius: var(--docs-radius-sm);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.docs-breadcrumb:hover {
		color: var(--docs-text);
		background: var(--docs-surface-hover);
	}

	.docs-breadcrumb-sep {
		color: var(--docs-text-tertiary);
		font-family: monospace;
	}

	/* Content */
	.docs-content {
		flex: 1;
	}

	/* Footer */
	.docs-footer {
		padding-top: var(--docs-spacing-2xl);
		border-top: 1px solid var(--docs-border);
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: var(--docs-spacing-sm);
		align-items: center;
	}

	.docs-footer-text {
		color: var(--docs-text-secondary);
		font-size: 0.875rem;
		margin: 0;
	}

	.docs-footer-link {
		color: var(--docs-accent);
		text-decoration: none;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.docs-footer-link:hover {
		text-decoration: underline;
	}

	.docs-footer-last-modified {
		color: var(--docs-text-tertiary);
		font-size: 0.75rem;
		margin: 0;
		font-style: italic;
	}

	/* === Prose Styles === */
	.docs-prose {
		color: var(--docs-text);
		line-height: 1.75;
	}

	.docs-prose :global(p) {
		margin: var(--docs-spacing-lg) 0;
		line-height: 1.8;
	}

	/* Headings */
	.docs-prose :global(h1) {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.2;
		margin-top: 0;
		margin-bottom: var(--docs-spacing-xl);
	}

	[data-theme="dracula"] .docs-prose :global(h1) {
		background: linear-gradient(135deg, #ff79c6 0%, #bd93f9 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	[data-theme="github"] .docs-prose :global(h1),
	[data-theme="minimal"] .docs-prose :global(h1) {
		color: var(--docs-text);
	}

	.docs-prose :global(h2) {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--docs-accent);
		border-bottom: 2px solid var(--docs-border);
		padding-bottom: var(--docs-spacing-sm);
		margin-top: var(--docs-spacing-2xl);
		margin-bottom: var(--docs-spacing-lg);
	}

	.docs-prose :global(h3) {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--docs-accent-secondary);
		margin-top: var(--docs-spacing-xl);
		margin-bottom: var(--docs-spacing-md);
	}

	.docs-prose :global(h4),
	.docs-prose :global(h5),
	.docs-prose :global(h6) {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--docs-text);
		margin-top: var(--docs-spacing-lg);
		margin-bottom: var(--docs-spacing-sm);
	}

	/* Inline code */
	.docs-prose :global(code) {
		background: var(--docs-surface);
		color: var(--docs-accent);
		padding: 0.2em 0.5em;
		border-radius: var(--docs-radius-sm);
		font-size: 0.9em;
		font-family: ui-monospace, monospace;
		font-weight: 500;
		border: 1px solid var(--docs-border);
	}

	/* Code blocks */
	.docs-prose :global(pre) {
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		border-radius: var(--docs-radius-lg);
		padding: 0;
		overflow-x: auto;
		margin: var(--docs-spacing-xl) 0;
	}

	.docs-prose :global(pre code) {
		background: transparent;
		color: var(--docs-text);
		padding: var(--docs-spacing-lg);
		display: block;
		border-radius: 0;
		font-size: 0.875rem;
		border: none;
	}

	/* Links */
	.docs-prose :global(a) {
		color: var(--docs-accent-tertiary);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
		border-bottom: 1px solid transparent;
	}

	.docs-prose :global(a:hover) {
		color: var(--docs-accent-secondary);
		border-bottom-color: var(--docs-accent-secondary);
	}

	/* Lists */
	.docs-prose :global(ul),
	.docs-prose :global(ol) {
		margin: var(--docs-spacing-lg) 0;
		padding-left: var(--docs-spacing-2xl);
		color: var(--docs-text);
	}

	.docs-prose :global(li) {
		margin: var(--docs-spacing-sm) 0;
		line-height: 1.8;
	}

	.docs-prose :global(ul li) {
		list-style-type: none;
		position: relative;
	}

	.docs-prose :global(ul li::before) {
		content: "▸";
		color: var(--docs-accent-secondary);
		position: absolute;
		left: -1.5rem;
		font-weight: bold;
	}

	.docs-prose :global(ol li::marker) {
		color: var(--docs-accent-tertiary);
		font-weight: 600;
	}

	/* Blockquotes */
	.docs-prose :global(blockquote) {
		border-left: 4px solid var(--docs-accent);
		padding-left: var(--docs-spacing-lg);
		padding-top: var(--docs-spacing-sm);
		padding-bottom: var(--docs-spacing-sm);
		background: var(--docs-surface);
		border-radius: 0 var(--docs-radius-md) var(--docs-radius-md) 0;
		color: var(--docs-text-secondary);
		font-style: italic;
		margin: var(--docs-spacing-xl) 0;
	}

	.docs-prose :global(blockquote p) {
		margin: var(--docs-spacing-sm) 0;
	}

	/* Tables */
	.docs-prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: var(--docs-spacing-xl) 0;
		font-size: 0.875rem;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		border-radius: var(--docs-radius-lg);
		overflow: hidden;
	}

	.docs-prose :global(table th) {
		background: var(--docs-surface-raised);
		color: var(--docs-accent);
		padding: var(--docs-spacing-md);
		text-align: left;
		border-bottom: 2px solid var(--docs-accent);
		font-weight: 600;
	}

	.docs-prose :global(table td) {
		padding: var(--docs-spacing-md);
		border-bottom: 1px solid var(--docs-border);
		color: var(--docs-text);
	}

	.docs-prose :global(table tr:last-child td) {
		border-bottom: none;
	}

	.docs-prose :global(table tr:hover) {
		background: var(--docs-surface-hover);
	}

	/* Images */
	.docs-prose :global(img) {
		max-width: 100%;
		border-radius: var(--docs-radius-lg);
		border: 1px solid var(--docs-border);
		margin: var(--docs-spacing-xl) 0;
	}

	/* Horizontal rule */
	.docs-prose :global(hr) {
		border: none;
		height: 2px;
		background: var(--docs-border);
		margin: var(--docs-spacing-2xl) 0;
		opacity: 0.5;
	}

	[data-theme="dracula"] .docs-prose :global(hr) {
		background: linear-gradient(90deg, #ff79c6 0%, #bd93f9 50%, #8be9fd 100%);
		opacity: 0.3;
	}

	/* Bold and emphasis */
	.docs-prose :global(strong) {
		color: var(--docs-accent-secondary);
		font-weight: 700;
	}

	.docs-prose :global(em) {
		color: var(--docs-text);
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.docs-layout {
			grid-template-columns: 1fr;
		}

		.docs-mobile-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.docs-sidebar-container {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			width: 280px;
			height: 100vh;
			z-index: 1000;
			transform: translateX(-100%);
			transition: transform 0.3s ease;
		}

		.docs-sidebar-container.mobile-open {
			transform: translateX(0);
		}

		.docs-overlay {
			display: block;
		}

		.docs-main {
			padding-left: calc(var(--docs-spacing-2xl) + var(--docs-spacing-lg) + 3rem);
		}
	}

	@media (max-width: 768px) {
		.docs-sidebar-container {
			width: 85vw;
			max-width: 320px;
		}

		.docs-main {
			padding: var(--docs-spacing-lg);
			padding-left: calc(var(--docs-spacing-2xl) + var(--docs-spacing-lg) + 2rem);
		}
	}
</style>
