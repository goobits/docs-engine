<script lang="ts">
  import { DocsPage } from '@goobits/docs-engine/components';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<DocsPage
  {data}
  titleSuffix="DocsEngine Documentation"
  descriptionMeta
  hydrators={{ screenshot: false, openapi: false }}
/>
