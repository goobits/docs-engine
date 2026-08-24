/**
 * Shared Shiki highlighter for client-side code highlighting
 * Reuses the same createHighlighter instance across all components
 */

import { createLogger } from '@goobits/logger';
import { escapeHtml } from './html.ts';
import { createDocsHighlighter, loadDocsLanguage, type DocsHighlighter } from './shiki-bundle.ts';

const logger = createLogger('docs-engine:highlighter');

const highlighterPromises = new Map<string, Promise<DocsHighlighter>>();

/**
 * Get or create the shared highlighter instance
 * @param theme - Theme to use (default: 'dracula')
 * @returns Highlighter instance
 */
export async function getHighlighter(theme: string = 'dracula'): Promise<DocsHighlighter> {
  let highlighterPromise = highlighterPromises.get(theme);
  if (!highlighterPromise) {
    highlighterPromise = createDocsHighlighter(theme);
    highlighterPromises.set(theme, highlighterPromise);
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
    await loadDocsLanguage(highlighter, language);
    return highlighter.codeToHtml(code, {
      lang: language,
      theme: theme,
    });
  } catch (err) {
    logger.error('Failed to highlight code, using fallback', { error: err, language, theme });
    // Fallback to plain code block
    return `<pre class="shiki ${theme}" style="background-color:#282a36;color:#f8f8f2"><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  }
}
