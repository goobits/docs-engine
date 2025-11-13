<script lang="ts">
  import type { TreeNode } from '@goobits/docs-engine/utils';
  import { getFileType, FILE_TYPES } from '@goobits/docs-engine/utils';

  interface Props {
    node: TreeNode;
    expandedFolders: Set<string>;
    hoveredPath: string | null;
    copiedPath: string | null;
    allowCopy: boolean;
    githubUrl: string | undefined;
    // eslint-disable-next-line no-unused-vars
    toggleFolder: (path: string) => void;
    // eslint-disable-next-line no-unused-vars
    copyPath: (path: string) => void;
    // eslint-disable-next-line no-unused-vars
    openInGithub: (path: string) => void;
  }

  let {
    node,
    expandedFolders,
    hoveredPath = $bindable(),
    copiedPath,
    allowCopy,
    githubUrl,
    toggleFolder,
    copyPath,
    openInGithub,
  }: Props = $props();

  // Computed
  let isFolder = $derived(node.type === 'folder');
  let isExpanded = $derived(isFolder && expandedFolders.has(node.path));
  let isHovered = $derived(hoveredPath === node.path);
  let isCopied = $derived(copiedPath === node.path);
  let fileType = $derived(isFolder ? FILE_TYPES.folder : getFileType(node.name, node.extension));
</script>

<div
  class="md-filetree__item"
  class:md-filetree__item--folder={isFolder}
  class:md-filetree__item--file={!isFolder}
  class:md-filetree__item--hovered={isHovered}
  role="treeitem"
  aria-level={node.depth + 1}
  aria-expanded={isFolder ? isExpanded : undefined}
  aria-label="{isFolder ? 'Folder' : 'File'}: {node.name}"
  style="--depth: {node.depth}; --file-color: {fileType.color}"
>
  <div
    class="md-filetree__row"
    on:mouseenter={() => (hoveredPath = node.path)}
    on:mouseleave={() => (hoveredPath = null)}
  >
    {#if isFolder}
      <button
        class="md-filetree__toggle"
        class:md-filetree__toggle--expanded={isExpanded}
        on:click={() => toggleFolder(node.path)}
        aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
      >
        ▶
      </button>
    {:else}
      <span class="md-filetree__spacer"></span>
    {/if}

    <span class="md-filetree__icon" aria-hidden="true">
      {fileType.icon}
    </span>

    <button
      class="md-filetree__name"
      class:md-filetree__name--folder={isFolder}
      class:md-filetree__name--copied={isCopied}
      on:click={() => allowCopy && copyPath(node.path)}
      title={allowCopy ? `Click to copy: ${node.path}` : node.path}
      aria-label={allowCopy
        ? `Copy path: ${node.path}`
        : `${isFolder ? 'Folder' : 'File'}: ${node.name}`}
      disabled={!allowCopy}
    >
      {node.name}{isFolder ? '/' : ''}
    </button>

    {#if isCopied}
      <span class="md-filetree__copied">✓ Copied</span>
    {/if}

    {#if githubUrl && isHovered}
      <button
        class="md-filetree__github"
        on:click={() => openInGithub(node.path)}
        title="Open in GitHub"
        aria-label="Open {node.name} in GitHub"
      >
        <span aria-hidden="true">↗</span>
      </button>
    {/if}
  </div>

  {#if isFolder && isExpanded && node.children}
    <div class="md-filetree__children" role="group">
      {#each node.children as child}
        <svelte:self
          node={child}
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
  {/if}
</div>

<style lang="scss">
  .md-filetree__item {
    display: flex;
    flex-direction: column;
  }

  .md-filetree__row {
    display: flex;
    align-items: center;
    gap: var(--md-spacing-xs, 0.25rem);
    padding: var(--md-spacing-xs, 0.25rem) var(--md-spacing-sm, 0.5rem);
    padding-left: calc(
      var(--md-spacing-sm, 0.5rem) + var(--depth, 0) * var(--md-spacing-lg, 1.5rem)
    );
    border-radius: var(--md-radius-sm, 6px);
    transition: background var(--md-duration-fast, 200ms)
      var(--md-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    position: relative;

    &:hover {
      background: var(--md-surface-raised);
    }
  }

  .md-filetree__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    background: none;
    border: none;
    color: var(--md-text-tertiary);
    cursor: pointer;
    transition: transform var(--md-duration-fast) var(--md-ease-out);
    font-size: 10px;

    &:hover {
      color: var(--md-text-primary);
    }

    &--expanded {
      transform: rotate(90deg);
    }
  }

  .md-filetree__spacer {
    width: 16px;
    flex-shrink: 0;
  }

  .md-filetree__icon {
    flex-shrink: 0;
    width: 20px;
    text-align: center;
    font-size: var(--md-font-size-base);
  }

  .md-filetree__name {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    font-family: var(--md-font-mono);
    font-size: var(--md-font-size-sm);
    color: var(--file-color, var(--md-text-primary));
    cursor: pointer;
    transition: all var(--md-duration-fast) var(--md-ease-out);
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover:not(:disabled) {
      color: var(--md-text-accent);
      text-decoration: underline;
    }

    &:disabled {
      cursor: default;
    }

    &--folder {
      font-weight: 600;
    }

    &--copied {
      color: var(--md-callout-green-text) !important;
    }
  }

  .md-filetree__copied {
    margin-left: auto;
    font-size: var(--md-font-size-xs);
    color: var(--md-callout-green-text);
    font-weight: 600;
    animation: fadeIn var(--md-duration-fast) var(--md-ease-out);
  }

  .md-filetree__github {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: var(--md-surface-elevated);
    border: 1px solid var(--md-border-medium);
    border-radius: var(--md-radius-sm);
    color: var(--md-text-secondary);
    cursor: pointer;
    transition: all var(--md-duration-fast) var(--md-ease-out);
    font-size: 12px;
    opacity: 0;
    animation: fadeIn var(--md-duration-fast) var(--md-ease-out) forwards;

    &:hover {
      background: var(--md-surface-overlay);
      border-color: var(--md-border-strong);
      color: var(--md-text-primary);
    }
  }

  .md-filetree__children {
    display: flex;
    flex-direction: column;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: calc(var(--md-spacing-sm) + var(--depth, 0) * var(--md-spacing-lg) + 8px);
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--md-border-subtle);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  // Mobile responsive
  @media (max-width: 768px) {
    .md-filetree__row {
      padding-left: calc(var(--md-spacing-xs) + var(--depth, 0) * var(--md-spacing-md));
    }

    .md-filetree__children::before {
      left: calc(var(--md-spacing-xs) + var(--depth, 0) * var(--md-spacing-md) + 8px);
    }
  }
</style>
