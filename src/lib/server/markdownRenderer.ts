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
  referencePlugin,
  remarkTableOfContents,
} from '../plugins/index.ts';
import type { ReferencePluginOptions } from '../plugins/reference.ts';
import type { ScreenshotPluginOptions } from '../plugins/screenshot.ts';

export interface RenderDocsMarkdownOptions {
  sourcePath?: string;
  gfm?: boolean;
  tableOfContents?: boolean;
  theme?: string;
  screenshots?: false | ScreenshotPluginOptions;
  references?: ReferencePluginOptions;
}

export async function renderDocsMarkdown(
  markdown: string,
  options: RenderDocsMarkdownOptions = {}
): Promise<string> {
  const processor = unified().use(remarkParse);
  if (options.gfm !== false) processor.use(remarkGfm);
  processor.use(remarkMath).use(remarkDirective);
  if (options.tableOfContents !== false) processor.use(remarkTableOfContents);
  processor
    .use(linksPlugin)
    .use(tabsPlugin)
    .use(calloutsPlugin)
    .use(filetreePlugin)
    .use(mermaidPlugin)
    .use(collapsePlugin);
  if (options.references) processor.use(referencePlugin, options.references);
  if (options.screenshots !== false) processor.use(screenshotPlugin, options.screenshots);
  const file = await processor
    .use(imageOptimizationPlugin)
    .use(katexPlugin)
    .use(codeHighlightPlugin, { theme: options.theme ?? 'dracula' })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process({ value: markdown, path: options.sourcePath });

  return String(file);
}
