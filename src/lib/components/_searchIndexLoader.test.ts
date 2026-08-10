import { describe, expect, it, vi } from 'vitest';
import { createSearchIndex } from '../utils/search-index.ts';
import { createSearchIndexLoader } from './_searchIndexLoader.ts';

const indexJson = createSearchIndex(
  [
    {
      title: 'Guides',
      description: 'Guides',
      links: [{ title: 'Search', href: '/docs/search', description: 'Find docs' }],
    },
  ],
  new Map([['/docs/search', '# Search\n\nSearchable content.']])
);

describe('createSearchIndexLoader', () => {
  it('does not fetch until load is called and shares the successful request', async () => {
    const request = vi.fn<typeof fetch>(async () => new Response(indexJson));
    const load = createSearchIndexLoader(() => '/docs/search-index.json', request);

    expect(request).not.toHaveBeenCalled();
    const [first, second] = await Promise.all([load(), load()]);

    expect(first).toBe(second);
    expect(first.searchIndexUrl).toBe('/docs/search-index.json');
    expect(first.index.search('Search')).toHaveLength(1);
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith('/docs/search-index.json', {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
  });

  it('clears a failed request so a later open can retry', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('offline', { status: 503 }))
      .mockResolvedValueOnce(new Response(indexJson));
    const load = createSearchIndexLoader(() => '/docs/search-index.json', request);

    await expect(load()).rejects.toThrow('Search index request failed with 503');
    await expect(load()).resolves.toMatchObject({ searchIndexUrl: '/docs/search-index.json' });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('invalidates the cached request when the endpoint changes', async () => {
    let searchIndexUrl = '/docs/search-index.json';
    const request = vi.fn<typeof fetch>(async () => new Response(indexJson));
    const load = createSearchIndexLoader(() => searchIndexUrl, request);

    await load();
    searchIndexUrl = '/reference/search-index.json';
    await load();

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1]?.[0]).toBe('/reference/search-index.json');
  });

  it('keeps in-flight results labeled with the endpoint that produced them', async () => {
    let searchIndexUrl = '/docs/search-index.json';
    const resolvers = new Map<string, (response: Response) => void>();
    const request = vi.fn(
      (url: string | URL | Request) =>
        new Promise<Response>((resolve) => {
          resolvers.set(String(url), resolve);
        })
    ) as typeof fetch;
    const load = createSearchIndexLoader(() => searchIndexUrl, request);

    const first = load();
    searchIndexUrl = '/reference/search-index.json';
    const second = load();
    resolvers.get('/reference/search-index.json')?.(new Response(indexJson));
    resolvers.get('/docs/search-index.json')?.(new Response(indexJson));

    await expect(first).resolves.toMatchObject({ searchIndexUrl: '/docs/search-index.json' });
    await expect(second).resolves.toMatchObject({ searchIndexUrl: '/reference/search-index.json' });
  });
});
