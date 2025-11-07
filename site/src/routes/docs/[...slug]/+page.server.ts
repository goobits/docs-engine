import { error } from '@sveltejs/kit';
import { readFile, stat, readdir } from 'fs/promises';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
import { dev } from '$app/environment';
import {
  remarkTableOfContents,
  linksPlugin,
  codeHighlightPlugin,
  calloutsPlugin,
  filetreePlugin,
  tabsPlugin,
  mermaidPlugin,
  collapsePlugin,
  referencePlugin,
} from 'dist/plugins/index.js';
import { logError, createDevError } from '$lib/utils/error-logger';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;

  // Point to the /docs folder (one level up from site/)
  const docsRoot = path.resolve(process.cwd(), '..', 'docs');
  const filePath = path.join(docsRoot, `${slug}.md`);

  try {
    // Check if file exists
    try {
      await stat(filePath);
    } catch {
      console.error(`[DocLoader] File not found: ${filePath}`);
      console.error(`[DocLoader] Requested slug: ${slug}`);
      console.error(`[DocLoader] Docs root: ${docsRoot}`);

      if (dev) {
        // List available files to help debug
        try {
          const availableFiles = await readdir(docsRoot);
          console.error('[DocLoader] Available files in docs root:', availableFiles);
        } catch (listErr) {
          console.error('[DocLoader] Could not list docs directory:', listErr);
        }
      }

      throw error(404, `Documentation page not found: ${slug}`);
    }

    // Read markdown file
    const fileContent = await readFile(filePath, 'utf-8');

    // Parse frontmatter
    let frontmatter, markdown;
    try {
      const parsed = matter(fileContent);
      frontmatter = parsed.data;
      markdown = parsed.content;
    } catch (err) {
      logError('Frontmatter', `Parse error in ${filePath}`, err);
      console.error(`[Frontmatter] File content preview:`, fileContent.substring(0, 200));

      if (dev) {
        throw error(
          500,
          createDevError(
            500,
            'Invalid frontmatter in markdown file',
            err instanceof Error ? err.message : String(err),
            'Check that your YAML frontmatter is properly formatted with --- delimiters.'
          ) as any
        );
      }
      throw error(404, 'Documentation page not found');
    }

    // Extract title from frontmatter or markdown
    const title =
      frontmatter.title ||
      markdown.match(/^#\s+(.+)$/m)?.[1] ||
      slug.split('/').pop()?.replace(/-/g, ' ') ||
      'Documentation';

    // Process markdown with unified pipeline
    let content;
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkTableOfContents)
        .use(linksPlugin)
        .use(calloutsPlugin)
        .use(filetreePlugin)
        .use(tabsPlugin)
        .use(mermaidPlugin)
        .use(collapsePlugin)
        .use(referencePlugin)
        .use(codeHighlightPlugin, { theme: 'dracula' })
        .use(remarkRehype)
        .use(rehypeStringify);

      content = String(await processor.process(markdown));
    } catch (err) {
      logError('Unified', `Processing failed for ${filePath}`, err);

      // Try to identify which plugin failed
      if (err instanceof Error && err.message.includes('codeHighlight')) {
        console.error('[Unified] Code highlighting plugin failed');
      } else if (err instanceof Error && err.message.includes('callouts')) {
        console.error('[Unified] Callouts plugin failed');
      }

      if (dev) {
        throw error(
          500,
          createDevError(
            500,
            'Markdown processing failed',
            err instanceof Error ? err.message : String(err),
            'Check for syntax errors in your markdown or plugin configuration.'
          ) as any
        );
      }
      throw error(404, 'Documentation page not found');
    }

    return {
      content,
      title,
      slug,
    };
  } catch (err) {
    // Catch-all error handler
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Re-throw SvelteKit errors (they're already formatted)
    if ('status' in (err as any)) {
      throw err;
    }

    // Log fatal error
    logError('DocLoader', `Fatal error loading ${filePath}`, err);

    // Create new error
    if (dev) {
      throw error(
        500,
        createDevError(
          500,
          `Failed to render documentation page: ${slug}`,
          errorMessage,
          'Check the server logs above for the full stack trace.'
        ) as any
      );
    }

    throw error(404, `Documentation page not found: ${slug}`);
  }
};
