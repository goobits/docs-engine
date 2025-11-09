import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';
import { escapeHtml } from '../utils/html.js';
import { encodeJsonBase64 } from '../utils/base64.js';

/**
 * Tab definition
 */
interface Tab {
  label: string;
  content: string;
  language?: string;
}

/**
 * MDsveX/Remark plugin to transform code tabs into interactive UI
 *
 * Transforms:
 * ```tabs:api-example
 * tab: JavaScript
 * ---
 * ```js
 * const data = await fetch('/api/users');
 * ```
 * ---
 * tab: TypeScript
 * ---
 * ```ts
 * const data: Response = await fetch('/api/users');
 * ```
 * ```
 *
 * Into:
 * <div class="md-code-tabs" data-tabs-id="api-example" data-tabs="...encoded..."></div>
 *
 * Which is then hydrated client-side into an interactive tabs component
 * @public
 */
export function tabsPlugin(): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      // Check if this is a tabs code block
      if (!node.lang?.startsWith('tabs:')) return;

      // Extract tabs ID from language
      const tabsId = node.lang.replace('tabs:', '');
      const content = node.value;

      // Parse tabs from content
      const tabs = parseTabs(content);

      if (tabs.length === 0) return;

      // Encode tabs data for client-side hydration
      const encoded = encodeJsonBase64(tabs);

      // Transform to HTML div that will be hydrated client-side
      // Type assertion needed as we're transforming from Code to HTML node
      (node as any).type = 'html';
      (node as any).value =
        `<div class="md-code-tabs" data-tabs-id="${escapeHtml(tabsId)}" data-tabs="${encoded}"></div>`;
    });
  };
}

/**
 * Parse tabs from content string
 *
 * Format:
 * tab: Label1
 * ---
 * ```lang
 * code here
 * ```
 * ---
 * tab: Label2
 * ---
 * ```lang
 * more code
 * ```
 */
function parseTabs(content: string): Tab[] {
  const tabs: Tab[] = [];
  const lines = content.split('\n');

  let currentLabel: string | null = null;
  let currentLanguage: string | undefined;
  let currentContent: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('tab:')) {
      // Finalize previous tab if exists
      if (currentLabel && currentContent.length > 0) {
        tabs.push({
          label: currentLabel,
          content: currentContent.join('\n').trim(),
          language: currentLanguage,
        });
      }

      // Start new tab
      currentLabel = line.replace(/^tab:\s*/, '').trim();
      currentContent = [];
      currentLanguage = undefined;
      inCodeBlock = false;
    } else if (trimmed === '---') {
      // Skip separator lines
      continue;
    } else if (trimmed.startsWith('```') && !inCodeBlock) {
      // Start of code block
      inCodeBlock = true;
      const lang = trimmed.slice(3).trim();
      if (lang) currentLanguage = lang;
    } else if (trimmed === '```' && inCodeBlock) {
      // End of code block
      inCodeBlock = false;
    } else if (inCodeBlock) {
      // Content line inside code block
      currentContent.push(line);
    }
  }

  // Finalize last tab
  if (currentLabel && currentContent.length > 0) {
    tabs.push({
      label: currentLabel,
      content: currentContent.join('\n').trim(),
      language: currentLanguage,
    });
  }

  return tabs;
}
