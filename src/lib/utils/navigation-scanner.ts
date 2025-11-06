/**
 * Filesystem scanner for documentation navigation generation
 * Walks a directory tree and extracts markdown files for navigation building
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import type { DocFile } from './navigation-builder.js';

/**
 * Options for scanning documentation files
 */
export interface ScanOptions {
  /** Root directory to scan */
  docsRoot: string;
  /** Base URL path for hrefs (default: "/docs") */
  basePath?: string;
  /** File patterns to exclude */
  exclude?: (path: string) => boolean;
}

/**
 * Recursively find all markdown files in a directory
 *
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative path calculation
 * @returns Array of relative file paths
 *
 * @example
 * ```typescript
 * const files = await findMarkdownFiles('/workspace/docs');
 * // Returns: ['quick-start.md', 'guides/setup.md', ...]
 * ```
 */
export async function findMarkdownFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return findMarkdownFiles(fullPath, baseDir);
      } else if (entry.name.endsWith('.md')) {
        return [relative(baseDir, fullPath).replace(/\\/g, '/')];
      }
      return [];
    })
  );
  return files.flat();
}

/**
 * Convert file path to URL href
 *
 * @param filePath - Relative file path (e.g., "guides/setup.md")
 * @param basePath - Base URL path (default: "/docs")
 * @returns URL href (e.g., "/docs/guides/setup")
 *
 * @example
 * ```typescript
 * pathToHref('quick-start.md', '/docs');  // "/docs/quick-start"
 * pathToHref('guides/setup.md', '/docs'); // "/docs/guides/setup"
 * ```
 */
export function pathToHref(filePath: string, basePath: string = '/docs'): string {
  return `${basePath}/${filePath.replace(/\.md$/, '')}`;
}

/**
 * Scan a directory and create DocFile objects for navigation building
 *
 * @param options - Scan configuration
 * @returns Array of DocFile objects ready for buildNavigation()
 *
 * @example
 * ```typescript
 * import { scanDocumentation, buildNavigation } from '@goobits/docs-engine/utils';
 *
 * const files = await scanDocumentation({
 *   docsRoot: '/workspace/docs',
 *   basePath: '/docs',
 *   exclude: (path) => path.includes('README') || path.startsWith('meta/')
 * });
 *
 * const navigation = buildNavigation(files, {
 *   icons: { 'Getting Started': RocketIcon }
 * });
 * ```
 */
export async function scanDocumentation(options: ScanOptions): Promise<DocFile[]> {
  const { docsRoot, basePath = '/docs', exclude } = options;

  // Find all markdown files
  const markdownFiles = await findMarkdownFiles(docsRoot);

  // Filter excluded files
  const filteredFiles = exclude ? markdownFiles.filter((path) => !exclude(path)) : markdownFiles;

  // Create DocFile objects
  const docFiles = await Promise.all(
    filteredFiles.map(async (filePath) => {
      const fullPath = join(docsRoot, filePath);
      const content = await readFile(fullPath, 'utf-8');
      const href = pathToHref(filePath, basePath);

      return {
        path: filePath,
        content,
        href,
      } as DocFile;
    })
  );

  return docFiles;
}

/**
 * Enhanced navigation builder with custom section inference
 *
 * Wrapper around buildNavigation() that adds support for:
 * - Custom section inference from file paths
 * - Frontmatter field mapping
 * - Pre/post processing hooks
 */
export interface EnhancedNavigationOptions {
  /** Custom function to infer section from file path */
  inferSection?: (path: string) => string | null;
  /** Map frontmatter fields to standard fields */
  mapFrontmatter?: (frontmatter: any) => any;
  /** Custom field names for frontmatter */
  frontmatterFields?: {
    section?: string; // Field name for section (default: 'section')
    order?: string; // Field name for order (default: 'order')
    description?: string; // Field name for description (default: 'description')
    hidden?: string; // Field name for hidden flag (default: 'hidden')
  };
}
