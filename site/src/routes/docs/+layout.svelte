<script lang="ts">
  /**
   * Docs Layout
   *
   * Simply passes data to child pages.
   * DocsLayout component in +page.svelte handles all UI/layout.
   */

  interface Props {
    children: any;
  }

  let { children }: Props = $props();
</script>

{@render children()}
