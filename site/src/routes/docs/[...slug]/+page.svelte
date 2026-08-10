<script lang="ts">
  /**
   * Docs Content Page
   *
   * Uses the official DocsLayout component from @goobits/docs-engine
   * for a polished documentation experience with all features.
   */

  import { page } from '$app/stores';
  import { Home } from '@lucide/svelte';
  import { DocsLayout } from '@goobits/docs-engine/components';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  // Get navigation and the lazy search endpoint from the parent layout
  const navigation = $derived($page.data.navigation || []);
  const searchIndexUrl = $derived($page.data.searchIndexUrl);

  // Configure breadcrumbs
  const breadcrumbs = [
    {
      label: '',
      href: '/',
      icon: Home,
    },
    {
      label: 'Docs',
      href: '/docs',
    },
  ];

  // Configure footer with edit link
  const footer = $derived({
    text: 'Questions or feedback?',
    editLink: {
      text: 'Edit this page on GitHub',
      url: `https://github.com/goobits/docs-engine/edit/main/docs/${data.slug}.md`,
    },
  });
</script>

<svelte:head>
  <title>{data.title} - DocsEngine Documentation</title>
</svelte:head>

<!-- Use official DocsLayout component -->
<DocsLayout
  content={data.content}
  title={data.title}
  {navigation}
  currentPath={$page.url.pathname}
  {breadcrumbs}
  {footer}
  theme="dracula"
  {searchIndexUrl}
/>
