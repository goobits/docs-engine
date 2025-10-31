<script lang="ts">
  /**
   * Content Component
   *
   * Minimal content component for @goobits/markdown-docs
   * Uses CSS variables for theming
   */

  import type { ContentProps } from './types.js';
  import type { Snippet } from 'svelte';

  interface Props extends ContentProps {
    children: Snippet;
  }

  let {
    variant = 'body',
    weight = 'normal',
    color = 'primary',
    class: className = '',
    children
  }: Props = $props();
</script>

<span class="md-content md-content--{variant} md-weight--{weight} md-color--{color} {className}">
  {@render children()}
</span>

<style>
  .md-content {
    font-family: var(--v2-font-system, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    line-height: var(--v2-line-height-normal, 1.5);
  }

  /* Variants */
  .md-content--title {
    font-size: var(--v2-font-size-3xl, 1.875rem);
    font-weight: 700;
    line-height: var(--v2-line-height-tight, 1.25);
  }

  .md-content--subtitle {
    font-size: var(--v2-font-size-xl, 1.25rem);
    font-weight: 600;
    line-height: var(--v2-line-height-tight, 1.25);
  }

  .md-content--body {
    font-size: var(--v2-font-size-base, 1rem);
    line-height: var(--v2-line-height-normal, 1.5);
  }

  .md-content--caption {
    font-size: var(--v2-font-size-sm, 0.875rem);
    line-height: var(--v2-line-height-normal, 1.5);
  }

  /* Weight */
  .md-weight--normal {
    font-weight: 400;
  }

  .md-weight--medium {
    font-weight: 500;
  }

  .md-weight--semibold {
    font-weight: 600;
  }

  .md-weight--bold {
    font-weight: 700;
  }

  /* Color */
  .md-color--primary {
    color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
  }

  .md-color--secondary {
    color: var(--v2-text-secondary, rgba(255, 255, 255, 0.7));
  }

  .md-color--tertiary {
    color: var(--v2-text-tertiary, rgba(255, 255, 255, 0.5));
  }
</style>
