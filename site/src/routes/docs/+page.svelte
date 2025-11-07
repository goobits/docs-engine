<script lang="ts">
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<article class="docs-content">
  {@html data.content}
</article>

<style>
  .docs-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
