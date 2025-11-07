import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { createHighlighter } from 'shiki';
import agentflowGrammar from '../utils/agentflow-grammar.json';
import { escapeHtml } from '../utils/html.js';

/**
 * Configuration options for code block highlighting
 *
 * @public
 */
export interface CodeHighlightOptions {
  /** Syntax highlighting theme (default: 'dracula') */
  theme?: string;
  /** Default language when none specified (default: 'plaintext') */
  defaultLanguage?: string;
  /** Enable line numbers by default (default: false) */
  showLineNumbers?: boolean;
  /** Enable copy button (default: true) */
  showCopyButton?: boolean;
}

/**
 * Metadata parsed from code fence info string
 *
 * Examples:
 * - ```typescript title="app.ts"
 * - ```javascript {1,3-5} showLineNumbers
 * - ```diff title="changes.patch"
 *
 * @public
 */
export interface CodeBlockMetadata {
  /** Programming language for syntax highlighting */
  language: string;
  /** Optional file title displayed above code block */
  title?: string;
  /** Lines to highlight (e.g., [1, 3, 4, 5]) */
  highlightLines?: number[];
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Whether this is a diff block */
  isDiff?: boolean;
  /** Original metadata string */
  raw: string;
}

// ============================================================================
// Module-Private Helpers (True Privacy via ESM)
// ============================================================================

/**
 * Cache the highlighter instance at module level
 * This is private to the module - not accessible from outside
 */
let highlighterPromise: Promise<any> | null = null;

/**
 * Parse metadata from code fence info string
 *
 * Supports syntax:
 * - Language: `typescript`, `javascript`, etc.
 * - Title: `title="filename.ts"`
 * - Line highlighting: `{1,3-5}` (lines 1, 3, 4, 5)
 * - Line numbers: `showLineNumbers`
 * - Diff mode: `diff` language
 *
 * Module-private helper - not exported
 */
function parseCodeMetadata(infoString: string): CodeBlockMetadata {
  const metadata: CodeBlockMetadata = {
    language: 'plaintext',
    raw: infoString,
  };

  if (!infoString) {
    return metadata;
  }

  // Extract language (first word)
  const parts = infoString.trim().split(/\s+/);
  metadata.language = parts[0] || 'plaintext';
  metadata.isDiff = metadata.language === 'diff';

  // Extract title: title="filename" or title='filename'
  const titleMatch = infoString.match(/title=["']([^"']+)["']/);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }

  // Extract line highlighting: {1,3-5,10}
  const highlightMatch = infoString.match(/\{([0-9,-]+)\}/);
  if (highlightMatch) {
    metadata.highlightLines = parseLineRange(highlightMatch[1]);
  }

  // Check for line numbers flag (only set if explicitly specified)
  if (infoString.includes('showLineNumbers')) {
    metadata.showLineNumbers = true;
  }

  return metadata;
}

/**
 * Parse line range string into array of line numbers
 *
 * Supports:
 * - Individual lines: `1,2,3` → [1, 2, 3]
 * - Ranges: `1-5` → [1, 2, 3, 4, 5]
 * - Mixed: `1,3-5,10` → [1, 3, 4, 5, 10]
 *
 * Module-private helper - not exported
 */
function parseLineRange(rangeString: string): number[] {
  const lines = new Set<number>();

  rangeString.split(',').forEach((part) => {
    if (part.includes('-')) {
      // Range: 3-5
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        lines.add(i);
      }
    } else {
      // Single line: 3
      lines.add(Number(part));
    }
  });

  return Array.from(lines).sort((a, b) => a - b);
}

/**
 * Process diff syntax and apply styling classes
 *
 * Diff lines:
 * - Lines starting with `+` are additions (green)
 * - Lines starting with `-` are deletions (red)
 * - Other lines are context (default)
 *
 * Module-private helper - not exported
 */
function applyDiffStyling(code: string, highlightedHtml: string): string {
  const lines = code.split('\n');
  const htmlLines = highlightedHtml.split('\n');

  const processedLines = htmlLines.map((htmlLine, index) => {
    const codeLine = lines[index];
    if (!codeLine) return htmlLine;

    if (codeLine.startsWith('+')) {
      return htmlLine.replace('<span class="line">', '<span class="line diff-add">');
    } else if (codeLine.startsWith('-')) {
      return htmlLine.replace('<span class="line">', '<span class="line diff-remove">');
    }
    return htmlLine;
  });

  return processedLines.join('\n');
}

/**
 * Wrap code block with metadata (title, line numbers, copy button)
 *
 * Module-private helper - not exported
 */
function wrapWithMetadata(
  highlightedHtml: string,
  metadata: CodeBlockMetadata,
  code: string
): string {
  const hasMetadata = metadata.title || metadata.showLineNumbers;
  if (!hasMetadata) {
    return highlightedHtml;
  }

  let wrappedHtml = '<div class="code-block-container">';

  // Add title bar
  if (metadata.title) {
    wrappedHtml += `<div class="code-block-title">${escapeHtml(metadata.title)}</div>`;
  }

  // Add line numbers
  if (metadata.showLineNumbers) {
    const lineCount = code.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    wrappedHtml += '<div class="code-block-with-lines">';
    wrappedHtml += '<div class="code-block-line-numbers" aria-hidden="true">';
    lineNumbers.forEach((num) => {
      const isHighlighted = metadata.highlightLines?.includes(num);
      const className = isHighlighted ? 'line-number highlight' : 'line-number';
      wrappedHtml += `<span class="${className}">${num}</span>`;
    });
    wrappedHtml += '</div>';
  }

  // Add highlighted code
  wrappedHtml += highlightedHtml;

  if (metadata.showLineNumbers) {
    wrappedHtml += '</div>';
  }

  wrappedHtml += '</div>';

  return wrappedHtml;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Remark plugin for advanced code block highlighting with Shiki
 *
 * Features:
 * - Syntax highlighting with Shiki
 * - Line highlighting: `{1,3-5}`
 * - Line numbers: `showLineNumbers`
 * - File titles: `title="filename"`
 * - Diff support: `diff` language with +/- prefixes
 * - Copy button (integrated with CodeCopyButton component)
 *
 * @param options - Configuration options
 * @returns Unified plugin transformer
 *
 * @example
 * ```typescript
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import { codeHighlightPlugin } from '@goobits/docs-engine/plugins';
 *
 * const processor = unified()
 *   .use(remarkParse)
 *   .use(codeHighlightPlugin, {
 *     theme: 'dracula',
 *     showLineNumbers: false
 *   });
 * ```
 *
 * @public
 */
export function codeHighlightPlugin(options: CodeHighlightOptions = {}) {
  const { theme = 'dracula', showLineNumbers = false } = options;

  return async (tree: Root) => {
    const codeNodes: Array<{ node: any; index: number; parent: any }> = [];

    // Collect all code nodes
    visit(tree, 'code', (node: any, index: number | undefined, parent: any) => {
      if (index !== undefined) {
        codeNodes.push({ node, index, parent });
      }
    });

    if (codeNodes.length === 0) {
      return;
    }

    // Get or create highlighter with enhanced language support
    if (!highlighterPromise) {
      highlighterPromise = (async () => {
        const h = await createHighlighter({
          themes: [theme],
          langs: [
            'typescript',
            'javascript',
            'python',
            'rust',
            'bash',
            'sql',
            'json',
            'html',
            'css',
            'svelte',
            'tsx',
            'jsx',
            'yaml',
            'toml',
            'markdown',
            'shell',
            'sh',
            'diff',
          ],
        });

        // Register AgentFlow grammar with aliases
        await h.loadLanguage({
          ...(agentflowGrammar as any),
          aliases: ['dsl', 'agentflow'],
        });

        return h;
      })();
    }

    const highlighter = await highlighterPromise;

    // Process each code node asynchronously
    await Promise.all(
      codeNodes.map(async ({ node, index: _index, parent: _parent }) => {
        const infoString = node.lang || '';
        const code = node.value;

        // Parse metadata from info string
        const metadata = parseCodeMetadata(infoString);

        // Apply global line numbers setting if not overridden
        if (metadata.showLineNumbers === undefined) {
          metadata.showLineNumbers = showLineNumbers;
        }

        // Skip if this is a custom language handled by other plugins
        const customLanguages = ['filetree', 'mermaid', 'callout', 'screenshot'];
        if (customLanguages.some((lang) => metadata.language.startsWith(lang))) {
          return;
        }

        // Skip if this is a tabs block
        if (metadata.language.startsWith('tabs:')) {
          return;
        }

        try {
          // Build decorations for highlighted lines (Shiki decorations API)
          const decorations =
            metadata.highlightLines && metadata.highlightLines.length > 0
              ? metadata.highlightLines.map((line) => ({
                  start: { line: line - 1, character: 0 },
                  end: { line: line - 1, character: Number.MAX_SAFE_INTEGER },
                  properties: { class: 'highlighted' },
                }))
              : [];

          // Highlight the code with Shiki
          let highlighted = highlighter.codeToHtml(code, {
            lang: metadata.isDiff ? 'diff' : metadata.language,
            theme: theme,
            decorations,
          });

          // Apply diff styling
          if (metadata.isDiff) {
            highlighted = applyDiffStyling(code, highlighted);
          }

          // Wrap with metadata (title, line numbers)
          highlighted = wrapWithMetadata(highlighted, metadata, code);

          // Transform the node to HTML
          // Escape curly braces for Svelte 5 parser compatibility
          node.type = 'html';
          node.value = highlighted.replace(/{/g, '&#123;').replace(/}/g, '&#125;');
          delete node.lang;
        } catch (error) {
          console.error(
            `Failed to highlight code block with language "${metadata.language}":`,
            error
          );
          // Fallback to plain code block
          // Escape curly braces for Svelte 5 parser compatibility
          node.type = 'html';
          const fallbackHtml = `<pre class="shiki ${theme}" style="background-color:#282a36;color:#f8f8f2"><code class="language-${metadata.language}">${escapeHtml(code)}</code></pre>`;
          node.value = fallbackHtml.replace(/{/g, '&#123;').replace(/}/g, '&#125;');
          delete node.lang;
        }
      })
    );
  };
}
