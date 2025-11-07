import { visit } from 'unist-util-visit';
import type { Root, Text, Paragraph, PhrasingContent } from 'mdast';
import type { Parent } from 'unist';
import {
  resolveSymbol,
  loadSymbolMap,
  type SymbolDefinition,
  type SymbolMap,
} from '../utils/symbol-resolver.js';
import { renderBlock, symbolToGitHubUrl } from '../utils/symbol-renderer.js';
import type { RenderOptions } from '../utils/symbol-renderer.js';

const INLINE_REFERENCE_REGEX = /{@([\w\/<>.,\[\]]+(?:#[\w.<>]+)?)}/g;

/**
 * Remark plugin to transform {@symbol} references into documentation
 *
 * Inline syntax: {@SymbolName} or {@path/hint#SymbolName}
 * Block syntax: :::reference SymbolName
 *
 * Examples:
 *   - {@RequestState} → links to type definition with hover tooltip
 *   - {@implementors/types#SessionState} → disambiguated reference
 *   - :::reference Implementor → full API documentation block
 * @public
 */
export function referencePlugin() {
  return (tree: Root) => {
    // Lazy load symbol map during transform phase (not during plugin init)
    let symbolMap: SymbolMap;
    try {
      symbolMap = loadSymbolMap();
    } catch (error: unknown) {
      // If symbol map doesn't exist, skip processing (dev mode convenience)
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Symbol map not loaded:', message);
      return;
    }

    // Sanitize tree: remove any undefined/null nodes
    sanitizeTree(tree);

    // Collect inline text nodes containing symbol references
    const inlineReplacements = new Map<Parent, Array<{ index: number; node: Text }>>();

    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      if (!INLINE_REFERENCE_REGEX.test(node.value)) return;

      INLINE_REFERENCE_REGEX.lastIndex = 0;

      const entries = inlineReplacements.get(parent);
      if (entries) {
        entries.push({ index, node });
      } else {
        inlineReplacements.set(parent, [{ index, node }]);
      }
    });

    // Apply inline replacements from the end of each parent's children array
    for (const [parent, entries] of inlineReplacements.entries()) {
      const parentWithChildren = parent as Parent & { children: PhrasingContent[] };
      entries
        .sort((a, b) => b.index - a.index)
        .forEach(({ index, node }) => {
          const replacementNodes = createInlineNodes(node.value, symbolMap);
          parentWithChildren.children.splice(index, 1, ...replacementNodes);
        });
    }

    // Collect reference block directives to transform after traversal
    const referenceBlocks: Array<any> = [];
    visit(tree, 'containerDirective', (node: any) => {
      if (node?.name === 'reference') {
        referenceBlocks.push(node);
      }
    });

    referenceBlocks.forEach((node) => {
      const symbolRef = extractSymbolReference(node);
      if (!symbolRef) {
        throw new Error(':::reference directive requires a symbol name');
      }

      const options = extractRenderOptions(node);

      try {
        const symbol = resolveSymbol(symbolRef, symbolMap);

        node.type = 'html';
        node.value = renderBlock(symbol, options);
        delete node.children;
        delete node.name;
        delete node.attributes;
        delete node.data;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to resolve symbol in :::reference ${symbolRef}: ${message}`);
      }
    });
  };
}

export interface ReferencePluginOptions {
  // Future: add options like strictMode, customSymbolMap path, etc.
}

function createInlineNodes(value: string, symbolMap: SymbolMap): PhrasingContent[] {
  const nodes: PhrasingContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_REFERENCE_REGEX.lastIndex = 0;

  while ((match = INLINE_REFERENCE_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        value: value.slice(lastIndex, match.index),
      });
    }

    const reference = match[1];

    try {
      const symbol = resolveSymbol(reference, symbolMap);
      nodes.push(createInlineReferenceNode(symbol));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to resolve symbol {@${reference}} in documentation: ${message}`);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push({
      type: 'text',
      value: value.slice(lastIndex),
    });
  }

  return nodes;
}

function createInlineReferenceNode(symbol: SymbolDefinition): PhrasingContent {
  const href = symbolToGitHubUrl(symbol);

  // Use JSDoc description for tooltip if available, fallback to signature
  const tooltip = symbol.jsDoc?.description
    ? `${symbol.jsDoc.description.split('\n')[0]}` // First line of description
    : symbol.signature;

  return {
    type: 'link',
    url: href,
    title: tooltip,
    data: {
      hName: 'a',
      hProperties: {
        href,
        className: ['symbol-ref', `symbol-ref--${symbol.kind}`],
        title: tooltip,
        target: '_blank',
        rel: 'noopener',
      },
    },
    children: [
      {
        type: 'text',
        value: symbol.name,
      },
    ],
  };
}

function extractSymbolReference(node: any): string | undefined {
  const firstChild = node.children?.[0];
  if (firstChild?.type === 'paragraph') {
    const textNode = (firstChild as Paragraph).children?.[0];
    if (textNode?.type === 'text') {
      return textNode.value.trim();
    }
  }
  return undefined;
}

function extractRenderOptions(node: any): RenderOptions {
  const showAttr = node.attributes?.show;
  if (!showAttr) return {};

  return {
    show: String(showAttr)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean) as RenderOptions['show'],
  };
}

/**
 * Recursively remove undefined/null nodes from the AST tree
 */
function sanitizeTree(node: any): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node.children)) {
    // Filter out undefined/null children
    node.children = node.children.filter((child: any) => child != null);
    // Recursively sanitize remaining children
    node.children.forEach((child: any) => sanitizeTree(child));
  }
}
