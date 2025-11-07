import { readFile } from 'fs/promises';
import { join } from 'path';
import { error } from '@sveltejs/kit';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkTableOfContents, linksPlugin } from 'dist/plugins/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const docsRoot = join(process.cwd(), '..', 'docs');
  const readmePath = join(docsRoot, 'index.md');

  try {
    const fileContent = await readFile(readmePath, 'utf-8');
    const { data: frontmatter, content: markdown } = matter(fileContent);

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(linksPlugin)
      .use(remarkTableOfContents)
      .use(remarkRehype)
      .use(rehypeStringify);

    const content = String(await processor.process(markdown));

    return {
      content,
      title: frontmatter.title || 'Documentation',
      slug: 'index',
    };
  } catch (err) {
    console.error('Failed to load index:', err);
    throw error(404, 'Documentation index not found');
  }
};
