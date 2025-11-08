/**
 * @goobits/markdown-docs Components
 *
 * Extracted from Spacebase, these components provide a complete
 * documentation system with sidebar navigation and content hydration.
 */

// Components
export { default as DocsLayout } from './DocsLayout.svelte';
export { default as DocsSidebar } from './DocsSidebar.svelte';
export { default as Screenshot } from './Screenshot.svelte';
export { default as ScreenshotImage } from './ScreenshotImage.svelte';
export { default as Mermaid } from './Mermaid.svelte';
export { default as MermaidHydrator } from './MermaidHydrator.svelte';
export { default as FileTree } from './FileTree.svelte';
export { default as FileTreeHydrator } from './FileTreeHydrator.svelte';
export { default as CodeTabs } from './CodeTabs.svelte';
export { default as CodeTabsHydrator } from './CodeTabsHydrator.svelte';
export { default as ScreenshotHydrator } from './ScreenshotHydrator.svelte';
export { default as CodeCopyButton } from './CodeCopyButton.svelte';
export { default as CodeCopyHydrator } from './CodeCopyHydrator.svelte';
export { default as OpenAPIDoc } from './OpenAPIDoc.svelte';
export { default as OpenAPIHydrator } from './OpenAPIHydrator.svelte';
export { default as CollapseHydrator } from './CollapseHydrator.svelte';

// New Components (Proposals 01-08)
export { default as DocsPrevNext } from './DocsPrevNext.svelte';
export { default as EditThisPage } from './EditThisPage.svelte';
export { default as PageMetadata } from './PageMetadata.svelte';
export { default as SearchModal } from './SearchModal.svelte';
export { default as MetaTags } from './MetaTags.svelte';
export { default as VersionSwitcher } from './VersionSwitcher.svelte';
export { default as VersionBanner } from './VersionBanner.svelte';
export { default as ThemeToggle } from './ThemeToggle.svelte';

// Image Optimization (Proposal 10)
export { default as OptimizedImage } from './OptimizedImage.svelte';
export { default as OptimizedImageHydrator } from './OptimizedImageHydrator.svelte';

// Types
export type * from './types';
