<script lang="ts">
  import { page } from '$app/stores';
  import { DocsLayout } from '@goobits/docs-engine/components';
  import type { SvelteKitDocsLayoutData, SvelteKitDocsPage } from '@goobits/docs-engine/sveltekit';
  import { Home } from '@lucide/svelte';

  interface Props {
    data: SvelteKitDocsPage & SvelteKitDocsLayoutData;
  }

  let { data }: Props = $props();

  const breadcrumbs = [
    { label: '', href: '/', icon: Home },
    { label: 'Docs', href: '/docs' },
  ];
</script>

<svelte:head>
  <title>{data.title} - DocsEngine Documentation</title>
  {#if data.description}<meta name="description" content={data.description} />{/if}
</svelte:head>

<DocsLayout
  content={data.content}
  title={data.title}
  navigation={data.navigation}
  currentPath={$page.url.pathname}
  {breadcrumbs}
  footer={{ text: 'Questions or feedback?' }}
  theme="dracula"
  editLink={data.editLink}
  searchIndexUrl={data.searchIndexUrl}
  hydrators={{ screenshot: false, openapi: false }}
/>
