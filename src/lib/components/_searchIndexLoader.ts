import type MiniSearch from 'minisearch';
import { loadSearchIndex } from '../utils/index.ts';

export interface LoadedSearchIndex {
  searchIndexUrl: string;
  index: MiniSearch;
}

/** Creates a lazy, retryable loader for one serialized MiniSearch endpoint. */
export function createSearchIndexLoader(
  getSearchIndexUrl: () => string,
  request: typeof fetch = fetch
): () => Promise<LoadedSearchIndex> {
  let activeUrl: string | null = null;
  let pending: Promise<LoadedSearchIndex> | null = null;

  return async () => {
    const searchIndexUrl = getSearchIndexUrl();
    if (activeUrl !== searchIndexUrl) {
      activeUrl = searchIndexUrl;
      pending = null;
    }

    pending ??= request(searchIndexUrl, {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Search index request failed with ${response.status}`);
      }
      return {
        searchIndexUrl,
        index: loadSearchIndex(await response.text()),
      };
    });
    const requestPromise = pending;

    try {
      return await requestPromise;
    } catch (error) {
      if (pending === requestPromise) pending = null;
      throw error;
    }
  };
}
