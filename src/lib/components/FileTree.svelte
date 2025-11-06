<script lang="ts">
  import { onMount } from 'svelte';
  import type { TreeNode } from '@goobits/docs-engine/utils';
  import { getFileType, FILE_TYPES } from '@goobits/docs-engine/utils';
  import FileTreeItem from './FileTreeItem.svelte';

  interface Props {
    data?: TreeNode[];
    showPath?: boolean;
    allowCopy?: boolean;
    githubUrl?: string | undefined;
  }

  let { data = [], showPath = true, allowCopy = true, githubUrl = undefined }: Props = $props();

  // State
  let expandedFolders = $state(new Set<string>());
  let hoveredPath = $state<string | null>(null);
  let copiedPath = $state<string | null>(null);

  // Expand all folders by default
  onMount(() => {
    const expandAll = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.type === 'folder') {
          expandedFolders.add(node.path);
          if (node.children) {
            expandAll(node.children);
          }
        }
      });
    };
    expandAll(data);
    // Trigger reactive updates now that folders are expanded
    expandedFolders = new Set(expandedFolders);
  });

  // Toggle folder expansion
  function toggleFolder(path: string) {
    if (expandedFolders.has(path)) {
      expandedFolders.delete(path);
    } else {
      expandedFolders.add(path);
    }
    expandedFolders = new Set(expandedFolders); // Trigger reactivity
  }

  // Copy path to clipboard
  async function copyPath(path: string) {
    if (!allowCopy) return;

    try {
      await navigator.clipboard.writeText(path);
      copiedPath = path;
      setTimeout(() => {
        copiedPath = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  }

  // Open in GitHub
  function openInGithub(path: string) {
    if (!githubUrl) return;
    const url = `${githubUrl}/${path}`;
    window.open(url, '_blank');
  }
</script>

<div class="md-filetree" role="tree">
  {#each data as node}
    <FileTreeItem
      {node}
      {expandedFolders}
      bind:hoveredPath
      {copiedPath}
      {allowCopy}
      {githubUrl}
      {toggleFolder}
      {copyPath}
      {openInGithub}
    />
  {/each}
</div>

<style lang="scss">
  .md-filetree {
    margin: var(--md-spacing-xl) 0;
    padding: var(--md-spacing-lg);
    background: var(--md-surface-base);
    border: 1px solid var(--md-border-subtle);
    border-radius: var(--md-radius-lg);
    font-family: var(--md-font-mono);
    font-size: var(--md-font-size-sm);
    overflow-x: auto;
    line-height: var(--md-line-height-relaxed);
  }

  // Mobile responsive
  @media (max-width: 768px) {
    .md-filetree {
      padding: var(--md-spacing-md);
      font-size: var(--md-font-size-xs);
    }
  }
</style>
