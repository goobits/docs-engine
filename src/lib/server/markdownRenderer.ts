import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import {
  calloutsPlugin,
  codeHighlightPlugin,
  collapsePlugin,
  filetreePlugin,
  imageOptimizationPlugin,
  katexPlugin,
  linksPlugin,
  mermaidPlugin,
  screenshotPlugin,
  tabsPlugin,
} from '../plugins/index.ts';

export interface RenderDocsMarkdownOptions {
  sourcePath?: string;
}

export async function renderDocsMarkdown(
  markdown: string,
  options: RenderDocsMarkdownOptions = {}
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(linksPlugin)
    .use(calloutsPlugin)
    .use(collapsePlugin)
    .use(filetreePlugin)
    .use(tabsPlugin)
    .use(mermaidPlugin)
    .use(screenshotPlugin)
    .use(imageOptimizationPlugin)
    .use(katexPlugin)
    .use(codeHighlightPlugin)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process({ value: markdown, path: options.sourcePath });

  return String(file);
}
