import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { Root } from 'mdast';
import { createHighlighter } from 'shiki';
import agentflowGrammar from '../utils/agentflow-grammar.json';
import { escapeHtml } from '../utils/html.js';

export interface CodeHighlightOptions {
	theme?: string;
	defaultLanguage?: string;
}

// Cache the highlighter instance
let highlighterPromise: Promise<any> | null = null;

/**
 * Remark plugin to highlight code blocks using Shiki
 *
 * This plugin transforms code blocks into syntax-highlighted HTML.
 * It runs asynchronously to support Shiki's async highlighting.
 *
 * @param options - Configuration for code highlighting
 * @returns A unified plugin
 */
export function codeHighlightPlugin(options: CodeHighlightOptions = {}) {
	const { theme = 'dracula', defaultLanguage = 'plaintext' } = options;

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

		// Get or create highlighter with AgentFlow support
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
						'sh'
					]
				});

				// Register AgentFlow grammar with aliases
				await h.loadLanguage({
					...(agentflowGrammar as any),
					aliases: ['dsl', 'agentflow']
				});

				return h;
			})();
		}

		const highlighter = await highlighterPromise;

		// Process each code node asynchronously
		await Promise.all(
			codeNodes.map(async ({ node, index, parent }) => {
				const language = node.lang || defaultLanguage;
				const code = node.value;

				// Skip if this is a custom language handled by other plugins
				const customLanguages = ['filetree', 'mermaid', 'callout', 'screenshot'];
				if (customLanguages.some((lang) => language.startsWith(lang))) {
					return;
				}

				// Skip if this is a tabs block
				if (language.startsWith('tabs:')) {
					return;
				}

				try {
					// Highlight the code with Shiki
					const highlighted = highlighter.codeToHtml(code, {
						lang: language,
						theme: theme
					});

					// Transform the node to HTML
					node.type = 'html';
					node.value = highlighted;
					delete node.lang;
				} catch (error) {
					console.error(`Failed to highlight code block with language "${language}":`, error);
					// Fallback to plain code block
					node.type = 'html';
					node.value = `<pre class="shiki ${theme}" style="background-color:#282a36;color:#f8f8f2"><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
					delete node.lang;
				}
			})
		);
	};
}
