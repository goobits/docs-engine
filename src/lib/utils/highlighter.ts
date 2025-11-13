/**
 * Shared Shiki highlighter for client-side code highlighting
 * Reuses the same createHighlighter instance across all components
 */

import { createHighlighter, type Highlighter } from 'shiki';
import { escapeHtml } from './html.js';
import { createLogger } from './logger.js';

const logger = createLogger('highlighter');

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Get or create the shared highlighter instance
 * @param theme - Theme to use (default: 'dracula')
 * @returns Highlighter instance
 */
export async function getHighlighter(theme: string = 'dracula'): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
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
        'vue',
        'go',
        'java',
        'c',
        'cpp',
        'csharp',
        'php',
        'ruby',
      ],
    });
  }

  return highlighterPromise;
}

/**
 * Highlight code with Shiki
 * @param code - Code to highlight
 * @param language - Programming language
 * @param theme - Theme to use (default: 'dracula')
 * @returns Highlighted HTML
 */
export async function highlightCode(
  code: string,
  language: string,
  theme: string = 'dracula'
): Promise<string> {
  try {
    const highlighter = await getHighlighter(theme);
    return highlighter.codeToHtml(code, {
      lang: language,
      theme: theme,
    });
  } catch (err) {
    logger.error({ error: err, language, theme }, 'Failed to highlight code, using fallback');
    // Fallback to plain code block
    return `<pre class="shiki ${theme}" style="background-color:#282a36;color:#f8f8f2"><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  }
}
