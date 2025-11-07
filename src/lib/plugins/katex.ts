import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import katex from 'katex';
import { escapeHtml } from '../utils/html.js';

/**
 * Configuration options for math rendering with KaTeX
 *
 * @public
 */
export interface KaTeXOptions {
  /**
   * Throw on LaTeX parse errors (default: false)
   * When false, renders error messages inline
   */
  strict?: boolean;

  /**
   * Trust mode - allows certain LaTeX commands
   * Set to true to allow \url, \href, and other commands (default: false)
   */
  trust?: boolean;

  /**
   * Custom KaTeX macros
   * Define reusable LaTeX macros for your documentation
   *
   * @example
   * ```typescript
   * {
   *   macros: {
   *     "\\RR": "\\mathbb{R}",
   *     "\\NN": "\\mathbb{N}"
   *   }
   * }
   * ```
   */
  macros?: Record<string, string>;

  /**
   * Display mode override
   * By default, inline math ($...$) uses inline mode
   * and block math ($$...$$) uses display mode
   */
  displayMode?: boolean;

  /**
   * Error color for invalid LaTeX (default: '#cc0000')
   */
  errorColor?: string;
}

// ============================================================================
// Module-Private Helpers (True Privacy via ESM)
// ============================================================================

/**
 * Math node metadata extracted from markdown
 * Module-private interface - not exported, not accessible outside this module
 */
interface MathNode {
  /** LaTeX expression to render */
  value: string;
  /** Display mode (block) vs inline mode */
  displayMode: boolean;
  /** Node type (always 'math' or 'inlineMath') */
  type: 'math' | 'inlineMath';
}

/**
 * Render LaTeX math expression to HTML using KaTeX
 * Module-private helper - not exported, not accessible outside this module
 *
 * @param latex - LaTeX expression to render
 * @param displayMode - Render as display (block) or inline math
 * @param options - KaTeX rendering options
 * @returns HTML string with rendered math
 */
function renderMath(
  latex: string,
  displayMode: boolean,
  options: KaTeXOptions = {}
): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: options.strict || false,
      trust: options.trust || false,
      macros: options.macros || {},
      errorColor: options.errorColor || '#cc0000',
      strict: options.strict ? 'error' : 'ignore',
    });
  } catch (error) {
    // Graceful error handling - render error message inline
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const escapedLatex = escapeHtml(latex);
    const escapedError = escapeHtml(errorMessage);

    if (displayMode) {
      return `<div class="katex-error" style="color: ${options.errorColor || '#cc0000'}">
				<strong>KaTeX Error:</strong> ${escapedError}<br>
				<code>${escapedLatex}</code>
			</div>`;
    } else {
      return `<span class="katex-error" style="color: ${options.errorColor || '#cc0000'}" title="${escapedError}">${escapedLatex}</span>`;
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Remark plugin for rendering mathematical equations with KaTeX
 *
 * Supports both inline and display (block) math:
 * - Inline math: `$E = mc^2$` - renders within text flow
 * - Display math: `$$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$` - centered block
 *
 * Features:
 * - Server-side rendering (no client JavaScript required)
 * - Custom macros for reusable expressions
 * - Graceful error handling with inline error messages
 * - Trust mode for advanced LaTeX commands (\url, \href)
 * - Compatible with dark mode via CSS
 *
 * @param options - Configuration options for KaTeX rendering
 * @returns Unified plugin transformer
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkMath from 'remark-math';
 * import { katexPlugin } from './katex';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkMath)  // Parse math syntax first
 *   .use(katexPlugin, {
 *     strict: false,
 *     macros: {
 *       "\\RR": "\\mathbb{R}"
 *     }
 *   });
 * ```
 *
 * @example Markdown Usage
 * ```markdown
 * Inline math: The famous equation $E = mc^2$ shows mass-energy equivalence.
 *
 * Display math (centered):
 * $$
 * \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
 * $$
 *
 * Complex expressions:
 * $$
 * \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
 * $$
 * ```
 *
 * @public
 */
export function katexPlugin(options: KaTeXOptions = {}) {
  return (tree: Root) => {
    const mathNodes: Array<{ node: any; index: number; parent: any }> = [];

    // Collect all math nodes (both inline and block)
    visit(tree, ['math', 'inlineMath'], (node: any, index: number | undefined, parent: any) => {
      if (index !== undefined) {
        mathNodes.push({ node, index, parent });
      }
    });

    if (mathNodes.length === 0) {
      return;
    }

    // Transform each math node to HTML
    mathNodes.forEach(({ node }) => {
      const latex = node.value;
      const displayMode = node.type === 'math'; // 'math' = display (block), 'inlineMath' = inline

      // Render with KaTeX
      const html = renderMath(latex, displayMode, options);

      // Transform node to HTML
      node.type = 'html';
      node.value = html;
      delete node.data;
    });
  };
}

/**
 * Parse inline and block math from markdown
 *
 * This is a simple parser that extracts math delimiters:
 * - Inline: `$...$`
 * - Block: `$$...$$`
 *
 * Note: In most cases, you should use `remark-math` which provides
 * more robust parsing. This is provided as a lightweight alternative.
 *
 * @param options - KaTeX configuration options
 * @returns Unified plugin transformer
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import { remarkMathParser, katexPlugin } from './katex';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(remarkMathParser)  // Simple math parser
 *   .use(katexPlugin);       // Render with KaTeX
 * ```
 *
 * @public
 */
export function remarkMathParser(options: KaTeXOptions = {}) {
  return (tree: Root) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !node.value) return;

      const text = node.value;
      const parts: any[] = [];
      let lastIndex = 0;

      // Match $$...$$ (display math) first to avoid conflicts
      const displayRegex = /\$\$([\s\S]+?)\$\$/g;
      let match;

      while ((match = displayRegex.exec(text)) !== null) {
        // Add text before math
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex, match.index),
          });
        }

        // Add display math node
        parts.push({
          type: 'math',
          value: match[1].trim(),
          data: { hName: 'div', hProperties: { className: ['math', 'math-display'] } },
        });

        lastIndex = match.index + match[0].length;
      }

      // Match $...$ (inline math) in remaining text
      const remainingText = text.slice(lastIndex);
      const inlineRegex = /\$([^\$\n]+?)\$/g;
      let inlineLastIndex = 0;

      while ((match = inlineRegex.exec(remainingText)) !== null) {
        // Add text before math
        if (match.index > inlineLastIndex) {
          parts.push({
            type: 'text',
            value: remainingText.slice(inlineLastIndex, match.index),
          });
        }

        // Add inline math node
        parts.push({
          type: 'inlineMath',
          value: match[1].trim(),
          data: { hName: 'span', hProperties: { className: ['math', 'math-inline'] } },
        });

        inlineLastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex === 0 && inlineLastIndex === 0) {
        // No math found, keep original node
        return;
      }

      if (inlineLastIndex < remainingText.length) {
        parts.push({
          type: 'text',
          value: remainingText.slice(inlineLastIndex),
        });
      }

      // Replace the text node with parsed parts
      if (parts.length > 0) {
        parent.children.splice(index, 1, ...parts);
      }
    });
  };
}
