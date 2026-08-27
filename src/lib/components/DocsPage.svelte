<script lang="ts">
  import { page } from '$app/stores';
  import { Home } from '@lucide/svelte';
  import type { ComponentProps } from 'svelte';
  import type { SvelteKitDocsLayoutData, SvelteKitDocsPage } from '../sveltekit/index.ts';
  import DocsLayout from './DocsLayout.svelte';

  type DocsLayoutProps = ComponentProps<typeof DocsLayout>;

  interface Props {
    data: SvelteKitDocsPage & SvelteKitDocsLayoutData;
    titleSuffix?: string;
    descriptionMeta?: boolean;
    breadcrumbs?: DocsLayoutProps['breadcrumbs'];
    footer?: DocsLayoutProps['footer'];
    theme?: DocsLayoutProps['theme'];
    hydrators?: DocsLayoutProps['hydrators'];
  }

  let {
    data,
    titleSuffix = 'Documentation',
    descriptionMeta = false,
    breadcrumbs = [
      { label: '', href: '/', icon: Home },
      { label: 'Docs', href: '/docs' },
    ],
    footer = { text: 'Questions or feedback?' },
    theme,
    hydrators,
  }: Props = $props();
</script>

<svelte:head>
  <title>{data.title} - {titleSuffix}</title>
  {#if descriptionMeta && data.description}
    <meta name="description" content={data.description} />
  {/if}
</svelte:head>

<DocsLayout
  content={data.content}
  title={data.title}
  navigation={data.navigation}
  currentPath={$page.url.pathname}
  {breadcrumbs}
  {footer}
  {theme}
  editLink={data.editLink}
  searchIndexUrl={data.searchIndexUrl}
  {hydrators}
/>
