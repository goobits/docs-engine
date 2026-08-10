import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { logError, createDevError } from '$lib/utils/error-logger';
import type { LayoutServerLoad } from './$types';
import { getDocsNavigation, searchIndexUrl } from './_docsData.server.ts';

export const load: LayoutServerLoad = async () => {
  try {
    return {
      navigation: await getDocsNavigation(),
      searchIndexUrl,
    };
  } catch (err) {
    // Log navigation generation errors
    logError('Navigation', 'Failed to build sidebar navigation', err);

    if (dev) {
      throw error(
        500,
        createDevError(
          500,
          'Failed to generate documentation navigation',
          err instanceof Error ? err.message : String(err),
          'Check that the docs folder exists and contains valid markdown files with frontmatter.'
        ) as { message: string }
      );
    }

    // In production, return empty navigation (graceful degradation)

    return {
      navigation: [],
      searchIndexUrl,
    };
  }
};
