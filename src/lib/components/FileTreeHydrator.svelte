<script lang="ts">
	/**
	 * Client-side hydrator for file tree components
	 *
	 * Finds all .md-filetree divs and renders them with FileTree component
	 * Use this in your layout or page to hydrate static HTML
	 */
	import { onMount, mount } from 'svelte';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import FileTree from './FileTree.svelte';
	import type { TreeNode } from '@goobits/docs-engine/utils';

	interface Props {
		githubUrl?: string;
		allowCopy?: boolean;
	}

	let { githubUrl, allowCopy = true }: Props = $props();

	function hydrate() {
		requestAnimationFrame(() => {
			try {
				const trees = document.querySelectorAll('.md-filetree[data-tree]');

				for (const element of trees) {
					const encoded = element.getAttribute('data-tree');
					if (!encoded) {
						console.warn('[FileTreeHydrator] Element missing data-tree attribute');
						continue;
					}

					try {
						const json = atob(encoded);
						const data: TreeNode[] = JSON.parse(json);

						element.removeAttribute('data-tree');

						mount(FileTree, {
							target: element,
							props: {
								data,
								githubUrl,
								allowCopy
							}
						});
					} catch (err) {
						console.error('[FileTreeHydrator] Failed to render file tree:', err);
						element.innerHTML = `<div class="md-callout md-callout--red">
							<div class="md-callout__header">
								<span class="md-callout__icon">⚠️</span>
								<span class="md-callout__label">File Tree Error</span>
							</div>
							<div class="md-callout__content">
								<p>Failed to render file tree. Invalid data format.</p>
								<pre>${err instanceof Error ? err.message : String(err)}</pre>
							</div>
						</div>`;
					}
				}
			} catch (err) {
				console.error('[FileTreeHydrator] Failed to hydrate file trees:', err);
			}
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
