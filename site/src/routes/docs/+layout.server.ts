import path from 'path';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { scanDocumentation } from 'dist/server/index.js';
import { buildNavigation, createSearchIndex } from 'dist/utils/index.js';
import { logError, createDevError } from '$lib/utils/error-logger';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  // Scan documentation directory
  const docsRoot = path.resolve(process.cwd(), '..', 'docs');

  try {
    // Scan all markdown files
    const docFiles = await scanDocumentation({
      docsRoot,
      basePath: '/docs',
      // Exclude any meta files or directories you don't want in navigation
      exclude: (filePath) =>
        filePath.includes('README') ||
        filePath.startsWith('_') ||
        filePath.includes('node_modules'),
    });

    // Build navigation structure from scanned files
    const navigation = buildNavigation(docFiles);

    // Build content map for search indexing (href -> markdown content)
    const contentMap = new Map<string, string>();
    docFiles.forEach((docFile) => {
      contentMap.set(docFile.href, docFile.content);
    });

    // Build search index
    console.log('[Search] Building search index from', docFiles.length, 'documents...');
    const searchIndexStart = Date.now();
    const searchIndex = createSearchIndex(navigation, contentMap);
    const searchIndexTime = Date.now() - searchIndexStart;
    console.log('[Search] Search index built in', searchIndexTime, 'ms');
    console.log('[Search] Index size:', Math.round(searchIndex.length / 1024), 'KB');

    // Remove icon functions (they can't be serialized for SSR)
    const serializableNavigation = navigation.map((section) => ({
      ...section,
      icon: undefined, // Remove icon function
      links: section.links.map((link) => ({
        ...link,
        icon: undefined, // Remove icon function from links
      })),
    }));

    return {
      navigation: serializableNavigation,
      searchIndex,
    };
  } catch (err) {
    // Log navigation generation errors
    logError('Navigation', 'Failed to build sidebar navigation', err);
    console.error('[Navigation] Docs root:', docsRoot);

    if (dev) {
      throw error(
        500,
        createDevError(
          500,
          'Failed to generate documentation navigation',
          err instanceof Error ? err.message : String(err),
          'Check that the docs folder exists and contains valid markdown files with frontmatter.'
        ) as any
      );
    }

    // In production, return empty navigation (graceful degradation)

    return {
      navigation: [],
      searchIndex: JSON.stringify({
        documentCount: 0,
        documentIds: [],
        fieldIds: {},
        fieldLength: {},
        averageFieldLength: {},
        storedFields: {},
        dirtCount: 0,
        nextId: 0,
        serializationVersion: 2,
      }),
    };
  }
};
