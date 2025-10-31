<script lang="ts">
  /**
   * Surface Component
   *
   * Minimal surface component for @goobits/markdown-docs
   * Uses CSS variables for theming
   */

  import type { SurfaceProps } from './types.js';
  import type { Snippet } from 'svelte';

  interface Props extends SurfaceProps {
    children: Snippet;
  }

  let {
    variant = 'base',
    radius = 'md',
    padding = 'md',
    class: className = '',
    children
  }: Props = $props();
</script>

<div class="md-surface md-surface--{variant} md-radius--{radius} md-padding--{padding} {className}">
  {@render children()}
</div>

<style>
  .md-surface {
    background: var(--v2-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
  }

  .md-surface--base {
    background: var(--v2-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .md-surface--raised {
    background: var(--v2-surface-raised, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--v2-border-medium, rgba(255, 255, 255, 0.12));
  }

  .md-surface--elevated {
    background: var(--v2-surface-elevated, rgba(255, 255, 255, 0.09));
    border: 1px solid var(--v2-border-medium, rgba(255, 255, 255, 0.12));
    box-shadow: var(--v2-shadow-md, 0 4px 8px rgba(0, 0, 0, 0.3));
  }

  /* Radius utilities */
  .md-radius--sm {
    border-radius: var(--v2-radius-sm, 6px);
  }

  .md-radius--md {
    border-radius: var(--v2-radius-md, 10px);
  }

  .md-radius--lg {
    border-radius: var(--v2-radius-lg, 14px);
  }

  .md-radius--xl {
    border-radius: var(--v2-radius-xl, 18px);
  }

  /* Padding utilities */
  .md-padding--sm {
    padding: var(--v2-spacing-sm, 0.5rem);
  }

  .md-padding--md {
    padding: var(--v2-spacing-md, 1rem);
  }

  .md-padding--lg {
    padding: var(--v2-spacing-lg, 1.5rem);
  }

  .md-padding--xl {
    padding: var(--v2-spacing-xl, 2rem);
  }
</style>
