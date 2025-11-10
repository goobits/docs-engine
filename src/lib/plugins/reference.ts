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

const INLINE_REFERENCE_REGEX = /{@([\w/<>.,[\]]+(?:#[\w.<>]+)?)}/g;

// ============================================================================
// Helper Functions (defined first to avoid hoisting issues)
// ============================================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Create an inline warning node for unresolved symbol references
 * Includes client-side console.error that will show in browser console
 */
function createWarningNode(reference: string, message: string): PhrasingContent {
  // For now, return a simple text node to test if the issue is with HTML nodes
  // TODO: Add back visual styling and console errors once we verify text nodes work
  return {
    type: 'html',
    value: `<span class="symbol-ref-error" title="${escapeHtml(message)}" style="color: #e74c3c; background: #fee; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; cursor: help; border: 1px solid #fcc;">⚠️${escapeHtml(reference)}</span>`,
  } as any;
}

/**
 * Create a warning block for unresolved reference blocks
 * Includes client-side console.error that will show in browser console
 */
function createWarningBlockHtml(reference: string, message: string): string {
  // Add client-side console error
  const consoleScript = `<script>console.error('[Symbol Reference Block Error]', '${escapeHtml(reference)}', '${escapeHtml(message).replace(/'/g, "\\'")}');</script>`;

  return `${consoleScript}<div class="symbol-ref-block-error" style="background: #fee; border-left: 4px solid #e74c3c; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
  <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #c0392b;">⚠️ Symbol Reference Error</p>
  <p style="margin: 0 0 0.5rem 0; font-family: monospace; font-size: 0.9em;">${escapeHtml(reference)}</p>
  <p style="margin: 0; color: #666; font-size: 0.9em;">${escapeHtml(message)}</p>
</div>`;
}

// ============================================================================
// Main Plugin
// ============================================================================

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
    const referenceBlocks: Array<unknown> = [];
    visit(tree, 'containerDirective', (node: unknown) => {
      if (node && typeof node === 'object' && 'name' in node && node.name === 'reference') {
        referenceBlocks.push(node);
      }
    });

    referenceBlocks.forEach((node) => {
      // Type assertion needed for node transformation
      const n = node as any;

      const symbolRef = extractSymbolReference(node);
      if (!symbolRef) {
        throw new Error(':::reference directive requires a symbol name');
      }

      const options = extractRenderOptions(node);

      try {
        const symbol = resolveSymbol(symbolRef, symbolMap);

        n.type = 'html';
        n.value = renderBlock(symbol, options);
        delete n.children;
        delete n.name;
        delete n.attributes;
        delete n.data;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[ReferencePlugin] Failed to resolve symbol in :::reference ${symbolRef}: ${message}`
        );
        // Instead of throwing, render a warning block
        n.type = 'html';
        n.value = createWarningBlockHtml(`:::reference ${symbolRef}`, message);
        delete n.children;
        delete n.name;
        delete n.attributes;
        delete n.data;
      }
    });
  };
}

export interface ReferencePluginOptions {
  // Future: add options like strictMode, customSymbolMap path, etc.
  // Placeholder property to satisfy ESLint (empty interfaces are discouraged)
  _placeholder?: never;
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
      console.warn(`[ReferencePlugin] Failed to resolve symbol {@${reference}}: ${message}`);
      // Instead of throwing, render an inline warning
      nodes.push(createWarningNode(`{@${reference}}`, message));
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
        className: ['symbol', `symbol--${symbol.kind}`],
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

function extractSymbolReference(node: unknown): string | undefined {
  if (!node || typeof node !== 'object' || !('children' in node)) return undefined;
  const nodeObj = node as Record<string, unknown>;
  const firstChild = Array.isArray(nodeObj.children) ? nodeObj.children[0] : undefined;
  if (
    firstChild &&
    typeof firstChild === 'object' &&
    'type' in firstChild &&
    firstChild.type === 'paragraph'
  ) {
    const textNode = (firstChild as Paragraph).children?.[0];
    if (textNode?.type === 'text') {
      return textNode.value.trim();
    }
  }
  return undefined;
}

function extractRenderOptions(node: unknown): RenderOptions {
  if (!node || typeof node !== 'object' || !('attributes' in node)) return {};
  const nodeObj = node as Record<string, unknown>;
  const showAttr = (nodeObj.attributes as Record<string, unknown> | undefined)?.show;
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
function sanitizeTree(node: unknown): void {
  if (!node || typeof node !== 'object') return;

  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj.children)) {
    // Filter out undefined/null children and cast to array
    const children = obj.children.filter((child: unknown) => child != null);
    obj.children = children;
    // Recursively sanitize remaining children
    children.forEach((child: unknown) => sanitizeTree(child));
  }
}
