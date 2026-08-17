<script lang="ts">
  import DocsPage from '$lib/DocsPage.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<DocsPage {data} />
