import path from 'path';
import { scanDocumentation } from 'dist/server/index.js';
import { buildNavigation } from 'dist/utils/index.js';
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
    };
  } catch (error) {
    console.error('Failed to load navigation:', error);
    // Return empty navigation on error
    return {
      navigation: [],
    };
  }
};
