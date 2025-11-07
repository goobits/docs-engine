import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import matter from 'gray-matter';
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
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;

  // Point to the /docs folder (one level up from site/)
  const docsRoot = path.resolve(process.cwd(), '..', 'docs');
  const filePath = path.join(docsRoot, `${slug}.md`);

  try {
    // Read markdown file
    const fileContent = await readFile(filePath, 'utf-8');

    // Parse frontmatter
    const { data: frontmatter, content: markdown } = matter(fileContent);

    // Extract title from frontmatter or markdown
    const title =
      frontmatter.title ||
      markdown.match(/^#\s+(.+)$/m)?.[1] ||
      slug.split('/').pop()?.replace(/-/g, ' ') ||
      'Documentation';

    // Process markdown with unified pipeline
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

    const content = String(await processor.process(markdown));

    return {
      content,
      title,
      slug,
    };
  } catch (err) {
    console.error(`Failed to load doc: ${filePath}`, err);
    throw error(404, `Documentation page not found: ${slug}`);
  }
};
