import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { Root } from 'mdast';
import { parseTree, getFileType } from '../utils/tree-parser.js';
import type { TreeNode } from '../utils/tree-parser.js';

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
 */
export function filetreePlugin() {
	return (tree: Root) => {
		visit(tree, 'code', (node: any) => {
			if (node.lang !== 'filetree') return;

			const treeString = node.value;

			try {
				// Parse the tree structure
				const treeData = parseTree(treeString);

				// Base64 encode the tree data to avoid HTML escaping issues
				const encoded = Buffer.from(JSON.stringify(treeData)).toString('base64');

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

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	const htmlEscapes: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};
	return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}
