import { getDocsSearchIndex } from '../_docsData.server.ts';

export const prerender = true;

export async function GET(): Promise<Response> {
  return new Response(await getDocsSearchIndex(), {
    headers: {
      'cache-control': 'public, max-age=300',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
