import { readFile } from 'fs/promises';
import path from 'path';
import { error } from '@sveltejs/kit';
import type { MarkdownDocsConfig } from '../config/defaults.js';
import type { DocPage, DocsLoader } from './types.js';

/**
 * Creates a document loader for markdown files
 * @param config - Configuration options for the docs loader
 * @returns A loader instance with a load method
 */
export function createDocsLoader(config: MarkdownDocsConfig): DocsLoader {
  const docsRootPath = path.resolve(process.cwd(), config.docsRoot);

  return {
    async load(slug: string): Promise<DocPage> {
      const filePath = path.join(docsRootPath, `${slug}.md`);

      try {
        const markdown = await readFile(filePath, 'utf-8');

        // Extract title from first # heading
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        const title = titleMatch
          ? titleMatch[1]
          : slug.split('/').pop()?.replace(/-/g, ' ') || 'Documentation';

        return { markdown, title, slug };
      } catch (err) {
        console.error(`Failed to load doc: ${filePath}`, err);
        throw error(404, `Documentation page not found: ${slug}`);
      }
    },
  };
}
