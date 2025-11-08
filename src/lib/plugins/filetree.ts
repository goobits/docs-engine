import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';
import { parseTree } from '../utils/tree-parser.js';
import { escapeHtml } from '../utils/html.js';
import { encodeJsonBase64 } from '../utils/base64.js';

/**
 * Remark plugin to transform filetree code blocks into interactive file trees
 *
 * Transforms:
 * ```filetree
 * src/
 * ├── lib/
 * │   └── utils.ts
 * └── main.ts
 * ```
 *
 * Into:
 * <div class="md-filetree" data-tree="...encoded..."></div>
 *
 * Which is then rendered client-side by the FileTree component
 * @public
 */
export function filetreePlugin(): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang !== 'filetree') return;

      const treeString = node.value;

      try {
        // Parse the tree structure
        const treeData = parseTree(treeString);

        // Base64 encode the tree data to avoid HTML escaping issues
        const encoded = encodeJsonBase64(treeData);

        // Transform to HTML div that will be hydrated client-side
        node.type = 'html';
        node.value = `<div class="md-filetree" data-tree="${encoded}"></div>`;
      } catch (error) {
        // If parsing fails, render an error message
        console.error('Failed to parse filetree:', error);
        node.type = 'html';
        node.value = `<div class="md-filetree md-filetree--error">
  <div class="md-callout md-callout--red">
    <div class="md-callout__header">
      <span class="md-callout__icon">⚠️</span>
      <span class="md-callout__label">Invalid File Tree</span>
    </div>
    <div class="md-callout__content">
      <p>Failed to parse file tree structure. Please check your syntax.</p>
      <pre><code>${escapeHtml(treeString)}</code></pre>
    </div>
  </div>
</div>`;
      }
    });
  };
}
