# Advanced Search Integration

Production-grade search with Algolia DocSearch and Meilisearch support for large-scale documentation sites.

## Overview

While docs-engine includes basic client-side search, advanced search providers offer enterprise features like typo tolerance, relevance ranking, analytics, and scalability for 10,000+ pages.

**Philosophy:** We provide configuration types and indexing utilities. You bring the search provider.

## Supported Providers

### Algolia DocSearch
- **Hosted**: Managed by Algolia
- **Free**: For open-source projects
- **Features**: Typo tolerance, instant results, analytics
- **Best for**: Open-source docs, public-facing sites

### Meilisearch
- **Self-hosted**: Deploy on your infrastructure
- **Open-source**: MIT licensed
- **Features**: Fast search, typo tolerance, facets
- **Best for**: Private docs, on-premise deployments

## Quick Start

### Option 1: Algolia DocSearch

#### 1. Apply for DocSearch

Visit [docsearch.algolia.com](https://docsearch.algolia.com/) to apply (free for open source).

#### 2. Configure Algolia

```typescript
// src/lib/config.ts
import type { AlgoliaConfig } from '@goobits/docs-engine/utils';

export const algoliaConfig: AlgoliaConfig = {
  appId: 'YOUR_APP_ID',
  apiKey: 'YOUR_SEARCH_API_KEY',
  indexName: 'YOUR_INDEX_NAME'
};
```

#### 3. Use Official Algolia Client

```bash
pnpm add @docsearch/js
```

```svelte
<script lang="ts">
  import '@docsearch/css';
  import docsearch from '@docsearch/js';
  import { onMount } from 'svelte';
  import { algoliaConfig } from '$lib/config';

  onMount(() => {
    docsearch({
      container: '#docsearch',
      ...algoliaConfig
    });
  });
</script>

<div id="docsearch" />
```

### Option 2: Meilisearch

#### 1. Deploy Meilisearch

```bash
# Docker
docker run -d -p 7700:7700 getmeili/meilisearch

# Or use Meilisearch Cloud
```

#### 2. Configure Meilisearch

```typescript
// src/lib/config.ts
import type { MeilisearchConfig } from '@goobits/docs-engine/utils';

export const meilisearchConfig: MeilisearchConfig = {
  host: 'http://localhost:7700',
  apiKey: 'YOUR_MASTER_KEY',
  indexName: 'docs'
};
```

#### 3. Build and Upload Index

```typescript
// scripts/build-search-index.ts
import { buildMeilisearchIndex } from '@goobits/docs-engine/utils';
import { MeiliSearch } from 'meilisearch';
import { meilisearchConfig } from '../src/lib/config';

const client = new MeiliSearch({
  host: meilisearchConfig.host,
  apiKey: meilisearchConfig.apiKey
});

// Build documents from markdown files
const documents = await buildMeilisearchIndex({
  docsDir: 'docs',
  baseUrl: 'https://example.com'
});

// Upload to Meilisearch
await client.index(meilisearchConfig.indexName).addDocuments(documents);
```

#### 4. Use Official Meilisearch Client

```bash
pnpm add meilisearch
```

```svelte
<script lang="ts">
  import { MeiliSearch } from 'meilisearch';
  import { meilisearchConfig } from '$lib/config';

  const client = new MeiliSearch({
    host: meilisearchConfig.host,
    apiKey: meilisearchConfig.apiKey
  });

  async function search(query: string) {
    const results = await client
      .index(meilisearchConfig.indexName)
      .search(query, {
        limit: 10,
        attributesToHighlight: ['title', 'content']
      });

    return results.hits;
  }
</script>

<input
  type="search"
  placeholder="Search docs..."
  on:input={(e) => search(e.target.value)}
/>
```

## API Reference

### TypeScript Types

#### AlgoliaConfig

```typescript
/**
 * Algolia DocSearch configuration
 * @public
 */
export interface AlgoliaConfig {
  /** Algolia application ID */
  appId: string;

  /** Search-only API key (public) */
  apiKey: string;

  /** Index name */
  indexName: string;
}
```

#### MeilisearchConfig

```typescript
/**
 * Meilisearch configuration
 * @public
 */
export interface MeilisearchConfig {
  /** Meilisearch host URL */
  host: string;

  /** API key */
  apiKey: string;

  /** Index name */
  indexName: string;
}
```

#### AdvancedSearchConfig

```typescript
/**
 * Advanced search provider configuration
 * @public
 */
export interface AdvancedSearchConfig {
  /** Search provider */
  provider: 'algolia' | 'meilisearch' | 'custom';

  /** Provider-specific configuration */
  config: AlgoliaConfig | MeilisearchConfig | Record<string, unknown>;
}
```

### Utilities

#### `buildMeilisearchIndex(options)`

Generate Meilisearch documents from markdown files.

```typescript
import { buildMeilisearchIndex } from '@goobits/docs-engine/utils';

const documents = await buildMeilisearchIndex({
  docsDir: 'docs',
  baseUrl: 'https://example.com',
  locales: ['en', 'es', 'zh']  // Optional: i18n support
});

// Returns:
// [
//   {
//     id: 'docs-getting-started',
//     title: 'Getting Started',
//     content: 'Learn how to...',
//     url: 'https://example.com/docs/getting-started',
//     locale: 'en',
//     headings: ['Installation', 'Quick Start'],
//     keywords: ['setup', 'install', 'guide']
//   },
//   ...
// ]
```

#### `generateMeilisearchSettings()`

Get recommended Meilisearch index settings.

```typescript
import { generateMeilisearchSettings } from '@goobits/docs-engine/utils';

const settings = generateMeilisearchSettings();

// Returns:
// {
//   searchableAttributes: ['title', 'headings', 'content'],
//   displayedAttributes: ['title', 'content', 'url', 'headings'],
//   filterableAttributes: ['locale', 'version'],
//   sortableAttributes: [],
//   rankingRules: [
//     'words',
//     'typo',
//     'proximity',
//     'attribute',
//     'sort',
//     'exactness'
//   ],
//   typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } }
// }

// Apply settings
await client.index('docs').updateSettings(settings);
```

## Indexing Strategies

### Build-Time Indexing (Recommended)

Generate index during build and upload to search provider.

```typescript
// scripts/build-and-deploy-search.ts
import { buildMeilisearchIndex, generateMeilisearchSettings } from '@goobits/docs-engine/utils';
import { MeiliSearch } from 'meilisearch';

async function deploySearchIndex() {
  // 1. Build documents
  const documents = await buildMeilisearchIndex({
    docsDir: 'docs',
    baseUrl: process.env.SITE_URL
  });

  // 2. Connect to Meilisearch
  const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_MASTER_KEY
  });

  // 3. Create/update index
  const index = client.index('docs');
  await index.updateSettings(generateMeilisearchSettings());

  // 4. Upload documents
  await index.addDocuments(documents);

  console.log(`✅ Indexed ${documents.length} documents`);
}

deploySearchIndex().catch(console.error);
```

**Add to CI/CD:**
```yaml
# .github/workflows/deploy.yml
- name: Build search index
  run: pnpm tsx scripts/build-and-deploy-search.ts
  env:
    MEILISEARCH_HOST: ${{ secrets.MEILISEARCH_HOST }}
    MEILISEARCH_MASTER_KEY: ${{ secrets.MEILISEARCH_MASTER_KEY }}
```

### Runtime Indexing

Index content when server starts (suitable for small sites).

```typescript
// src/hooks.server.ts
import { buildMeilisearchIndex } from '@goobits/docs-engine/utils';
import { MeiliSearch } from 'meilisearch';

export async function handle({ event, resolve }) {
  if (!global.searchIndexed) {
    const documents = await buildMeilisearchIndex({
      docsDir: 'docs',
      baseUrl: event.url.origin
    });

    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY
    });

    await client.index('docs').addDocuments(documents);
    global.searchIndexed = true;
  }

  return resolve(event);
}
```

## Advanced Features

### Multi-Language Indexing

Index documents for multiple locales.

```typescript
import { buildMeilisearchIndex } from '@goobits/docs-engine/utils';

const locales = ['en', 'es', 'zh'];
const allDocuments = [];

for (const locale of locales) {
  const documents = await buildMeilisearchIndex({
    docsDir: `docs/${locale}`,
    baseUrl: `https://example.com/${locale}`,
    metadata: { locale }
  });

  allDocuments.push(...documents);
}

await client.index('docs').addDocuments(allDocuments);
```

**Filter by locale in search:**
```typescript
const results = await client
  .index('docs')
  .search(query, {
    filter: `locale = ${currentLocale}`
  });
```

### Versioned Documentation

Index multiple versions separately.

```typescript
const versions = ['v1', 'v2', 'latest'];

for (const version of versions) {
  const documents = await buildMeilisearchIndex({
    docsDir: `docs/${version}`,
    baseUrl: `https://example.com/docs/${version}`,
    metadata: { version }
  });

  allDocuments.push(...documents);
}
```

**Filter by version:**
```typescript
const results = await client
  .index('docs')
  .search(query, {
    filter: `version = ${currentVersion}`
  });
```

### Custom Document Processing

Add custom metadata or transform content.

```typescript
import { buildMeilisearchIndex } from '@goobits/docs-engine/utils';

const documents = await buildMeilisearchIndex({
  docsDir: 'docs',
  baseUrl: 'https://example.com',
  transform: (doc) => ({
    ...doc,
    category: inferCategory(doc.url),
    difficulty: inferDifficulty(doc.content),
    keywords: extractKeywords(doc.content)
  })
});
```

## Integration Examples

### Replace Built-in Search with Algolia

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '@docsearch/css';
  import docsearch from '@docsearch/js';
  import { onMount } from 'svelte';
  import { algoliaConfig } from '$lib/config';

  onMount(() => {
    docsearch({
      container: '#docsearch',
      appId: algoliaConfig.appId,
      apiKey: algoliaConfig.apiKey,
      indexName: algoliaConfig.indexName,
      insights: true,  // Enable analytics
    });

    // Listen for Cmd+K / Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('#docsearch button')?.click();
      }
    });
  });
</script>

<div id="docsearch" />
<slot />
```

### Custom Meilisearch UI

```svelte
<script lang="ts">
  import { MeiliSearch } from 'meilisearch';
  import { meilisearchConfig } from '$lib/config';

  let query = $state('');
  let results = $state([]);
  let loading = $state(false);

  const client = new MeiliSearch({
    host: meilisearchConfig.host,
    apiKey: meilisearchConfig.apiKey
  });

  async function handleSearch() {
    if (query.length < 2) {
      results = [];
      return;
    }

    loading = true;
    try {
      const response = await client
        .index(meilisearchConfig.indexName)
        .search(query, {
          limit: 10,
          attributesToHighlight: ['title', 'content'],
          attributesToCrop: ['content'],
          cropLength: 200
        });

      results = response.hits;
    } finally {
      loading = false;
    }
  }
</script>

<div class="search-modal">
  <input
    type="search"
    bind:value={query}
    on:input={handleSearch}
    placeholder="Search documentation..."
    class="search-input"
  />

  {#if loading}
    <div class="loading">Searching...</div>
  {/if}

  <div class="results">
    {#each results as result}
      <a href={result.url} class="result-item">
        <h3>{@html result._formatted.title}</h3>
        <p>{@html result._formatted.content}</p>
      </a>
    {/each}
  </div>
</div>
```

## Performance Optimization

### Caching

Cache search results on client:

```typescript
const searchCache = new Map<string, SearchResult[]>();

async function search(query: string) {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  const results = await client.index('docs').search(query);
  searchCache.set(query, results.hits);

  return results.hits;
}
```

### Debouncing

Avoid excessive search requests:

```typescript
let debounceTimer: NodeJS.Timeout;

function debouncedSearch(query: string) {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    results = await search(query);
  }, 300);  // Wait 300ms after typing stops
}
```

### Lazy Loading

Load search client only when needed:

```svelte
<script lang="ts">
  let searchClient = $state(null);

  async function initSearch() {
    if (!searchClient) {
      const { MeiliSearch } = await import('meilisearch');
      searchClient = new MeiliSearch({ ... });
    }
    return searchClient;
  }
</script>

<button on:click={initSearch}>Open Search</button>
```

## Deployment

### Meilisearch Cloud

1. Create account at [cloud.meilisearch.com](https://cloud.meilisearch.com)
2. Create project
3. Get host URL and API keys
4. Update config with production credentials

### Self-Hosted Meilisearch

```yaml
# docker-compose.yml
version: '3'
services:
  meilisearch:
    image: getmeili/meilisearch:latest
    ports:
      - "7700:7700"
    environment:
      - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
      - MEILI_ENV=production
    volumes:
      - ./data.ms:/data.ms
```

```bash
# Deploy
docker-compose up -d

# Build and upload index
pnpm tsx scripts/build-and-deploy-search.ts
```

## Troubleshooting

### Algolia: No Results

**Issue:** Search returns empty results

**Solutions:**
- Verify crawler has indexed your site
- Check index name matches config
- Ensure API key has search permissions
- Verify site is publicly accessible

### Meilisearch: Connection Failed

**Issue:** Cannot connect to Meilisearch

**Solutions:**
- Verify Meilisearch is running: `curl http://localhost:7700/health`
- Check host URL includes protocol: `http://localhost:7700`
- Verify API key is correct
- Check network/firewall settings

### Slow Indexing

**Issue:** Building index takes too long

**Solutions:**
- Index incrementally (only changed files)
- Use smaller `cropLength` for content
- Exclude large files or binary content
- Process files in parallel

## Best Practices

### Index Structure

**Do:**
- Keep documents focused (one page = one document)
- Include relevant metadata (locale, version, category)
- Use meaningful document IDs
- Crop content to reasonable length (< 5000 chars)

**Don't:**
- Index entire site as single document
- Include navigation/UI text in content
- Store HTML in search index
- Index auto-generated content

### Search UX

- Show instant results (debounce 200-300ms)
- Highlight matching text
- Display result context (headings, breadcrumbs)
- Implement keyboard navigation
- Show "No results" with suggestions

### Security

- **Never** expose master/admin API keys
- Use search-only keys in frontend
- Implement rate limiting
- Filter private/draft content from index
- Use CORS restrictions for production

## Migration Guide

### From Built-in Search to Algolia

1. Apply for Algolia DocSearch
2. Wait for approval and receive credentials
3. Install `@docsearch/js`
4. Replace `SearchModal` with DocSearch component
5. Remove client-side search index generation

### From Built-in Search to Meilisearch

1. Deploy Meilisearch instance
2. Install `meilisearch` package
3. Build search index with `buildMeilisearchIndex`
4. Create custom search UI or use Meilisearch Instant
5. Add index building to CI/CD pipeline

## Related

- [Search Modal](./SEARCH.md) - Built-in client-side search
- [i18n](./I18N.md) - Multi-language search indexing
- [Versioning](./VERSIONING.md) - Version-aware search

---

**Need help?** Check [Algolia DocSearch docs](https://docsearch.algolia.com/docs/what-is-docsearch) or [Meilisearch docs](https://docs.meilisearch.com).
