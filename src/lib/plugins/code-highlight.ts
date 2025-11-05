import { visit } from 'unist-util-visit';
import type { Plugin, Transformer } from 'unified';
import type { Root } from 'mdast';
import { createHighlighter } from 'shiki';
import agentflowGrammar from '../utils/agentflow-grammar.json';

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
				const infoString = node.lang || defaultLanguage;
				const code = node.value;

				// Parse language and line highlighting from info string
				const { language, lines } = parseLineHighlighting(infoString);

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
					// Build decorations for highlighted lines
					const decorations = lines.length > 0
						? lines.map((line) => ({
								start: { line: line - 1, character: 0 },
								end: { line: line - 1, character: Number.MAX_SAFE_INTEGER },
								properties: { class: 'highlighted' }
						  }))
						: [];

					// Highlight the code with Shiki
					const highlighted = highlighter.codeToHtml(code, {
						lang: language,
						theme: theme,
						decorations
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

/**
 * Parse line highlighting ranges from info string
 * Supports: {1}, {1,3,5}, {1-5}, {1,3-5,7}
 * @param infoString - The code fence info string (e.g., "typescript{1,3-5}")
 * @returns { language: string, lines: number[] }
 */
function parseLineHighlighting(infoString: string): { language: string; lines: number[] } {
	const match = infoString.match(/^(\w+)\{([0-9,\-]+)\}$/);

	if (!match) {
		return { language: infoString, lines: [] };
	}

	const language = match[1];
	const rangeString = match[2];

	// Parse comma-separated ranges: "1,3-5,7"
	const lines: number[] = [];
	const parts = rangeString.split(',');

	for (const part of parts) {
		if (part.includes('-')) {
			// Range: "3-5"
			const [start, end] = part.split('-').map(Number);
			for (let i = start; i <= end; i++) {
				lines.push(i);
			}
		} else {
			// Single line: "1"
			lines.push(Number(part));
		}
	}

	return { language, lines: [...new Set(lines)].sort((a, b) => a - b) };
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
