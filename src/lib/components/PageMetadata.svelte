<script lang="ts">
  /**
   * Page Metadata Component
   *
   * Displays page metadata including last updated date and contributors.
   * Shows content freshness and recognizes contributors.
   */

  import { Clock, Users } from '@lucide/svelte';
  import type { Contributor } from '../utils';
  import { formatRelativeDate } from '../utils';

  interface Props {
    /** Last updated date from Git history */
    lastUpdated?: Date | null;
    /** List of contributors from Git history */
    contributors?: Contributor[];
    /** Whether to show contributor avatars (default: true) */
    showContributors?: boolean;
  }

  let { lastUpdated = null, contributors = [], showContributors = true }: Props = $props();

  const relativeDate = $derived(lastUpdated ? formatRelativeDate(lastUpdated) : null);
  const displayContributors = $derived(showContributors ? contributors.slice(0, 5) : []);
</script>

{#if lastUpdated || (showContributors && contributors.length > 0)}
  <div class="page-metadata">
    {#if lastUpdated && relativeDate}
      <div class="page-metadata-item">
        <Clock size={16} />
        <span class="page-metadata-label">Last updated:</span>
        <span class="page-metadata-value">{relativeDate}</span>
      </div>
    {/if}

    {#if showContributors && displayContributors.length > 0}
      <div class="page-metadata-item">
        <Users size={16} />
        <span class="page-metadata-label">Contributors:</span>
        <div class="page-metadata-contributors">
          {#each displayContributors as contributor (contributor.email)}
            <div
              class="page-metadata-contributor"
              title={`${contributor.name} (${contributor.commits} commit${contributor.commits > 1 ? 's' : ''})`}
            >
              {#if contributor.avatar}
                <img src={contributor.avatar} alt={contributor.name} class="page-metadata-avatar" />
              {:else}
                <div class="page-metadata-avatar-placeholder">
                  {contributor.name.charAt(0).toUpperCase()}
                </div>
              {/if}
            </div>
          {/each}
          {#if contributors.length > 5}
            <span class="page-metadata-more">+{contributors.length - 5}</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .page-metadata {
    display: flex;
    flex-direction: column;
    gap: var(--docs-spacing-md, 1rem);
    padding: var(--docs-spacing-lg, 1.5rem);
    background: var(--docs-surface, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--docs-border, rgba(255, 255, 255, 0.06));
    border-radius: var(--docs-radius-lg, 14px);
    margin-top: var(--docs-spacing-xl, 2rem);
  }

  .page-metadata-item {
    display: flex;
    align-items: center;
    gap: var(--docs-spacing-sm, 0.5rem);
    color: var(--docs-text-secondary, rgba(248, 248, 242, 0.7));
    font-size: 0.875rem;
  }

  .page-metadata-label {
    font-weight: 500;
  }

  .page-metadata-value {
    color: var(--docs-text, #f8f8f2);
    font-weight: 600;
  }

  .page-metadata-contributors {
    display: flex;
    align-items: center;
    gap: var(--docs-spacing-xs, 0.25rem);
    margin-left: var(--docs-spacing-xs, 0.25rem);
  }

  .page-metadata-contributor {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .page-metadata-avatar,
  .page-metadata-avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--docs-border, rgba(255, 255, 255, 0.06));
    transition: all 0.2s ease;
  }

  .page-metadata-avatar {
    object-fit: cover;
  }

  .page-metadata-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--docs-surface-raised, rgba(255, 255, 255, 0.06));
    color: var(--docs-accent, #bd93f9);
    font-weight: 600;
    font-size: 0.75rem;
  }

  .page-metadata-contributor:hover .page-metadata-avatar,
  .page-metadata-contributor:hover .page-metadata-avatar-placeholder {
    border-color: var(--docs-accent, #bd93f9);
    transform: scale(1.1);
  }

  .page-metadata-more {
    margin-left: var(--docs-spacing-xs, 0.25rem);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--docs-text-tertiary, rgba(248, 248, 242, 0.5));
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-metadata {
      padding: var(--docs-spacing-md, 1rem);
    }

    .page-metadata-item {
      flex-wrap: wrap;
    }
  }
</style>
