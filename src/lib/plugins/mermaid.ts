import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

/**
 * MDsveX/Remark plugin to transform Mermaid code blocks into renderable diagrams
 *
 * Transforms:
 * ```mermaid
 * graph TD
 *   A --> B
 * ```
 *
 * Into:
 * <div class="md-mermaid" data-diagram="...encoded..."></div>
 *
 * Which is then rendered client-side by mermaid.js
 */
export function mermaidPlugin(): Plugin {
	return (tree: Root) => {
		visit(tree, 'code', (node: any) => {
			if (node.lang !== 'mermaid') return;

			const diagram = node.value;

			// Base64 encode the diagram to avoid HTML escaping issues
			const encoded = Buffer.from(diagram).toString('base64');

			// Transform to HTML div that will be hydrated client-side
			node.type = 'html';
			node.value = `<div class="md-mermaid" data-diagram="${encoded}"></div>`;
		});
	};
}
