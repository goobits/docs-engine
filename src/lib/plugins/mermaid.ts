import { visit } from 'unist-util-visit';
import type { Root, Code } from 'mdast';
import { encodeBase64 } from '../utils/base64.js';

/**
 * Interface for mutating AST nodes during transformation
 * Used when transforming Code nodes to Html nodes
 */
interface MutableCodeNode {
  type: string;
  value?: string;
}

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
 * @public
 */
export function mermaidPlugin(): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang !== 'mermaid') return;

      const diagram = node.value;

      // Base64 encode the diagram to avoid HTML escaping issues
      const encoded = encodeBase64(diagram);

      // Transform to HTML div that will be hydrated client-side
      // Type assertion needed as we're transforming from Code to HTML node
      const mutableNode = node as MutableCodeNode;
      mutableNode.type = 'html';
      mutableNode.value = `<div class="md-mermaid" data-diagram="${encoded}"></div>`;
    });
  };
}
