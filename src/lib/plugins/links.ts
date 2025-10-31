import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Link } from 'mdast';

/**
 * Configuration options for the links plugin
 */
export interface LinksPluginOptions {
	/**
	 * Top-level files that should not get /docs/ prefix
	 * These are typically repository root files like README, LICENSE, etc.
	 * @default ['README', 'LICENSE', 'CONTRIBUTING', 'CHANGELOG', 'CODE_OF_CONDUCT', 'SECURITY', 'CLAUDE']
	 */
	topLevelFiles?: string[];
}

/**
 * Default top-level files that should remain at repository root
 */
const DEFAULT_TOP_LEVEL_FILES = [
	'README',
	'LICENSE',
	'CONTRIBUTING',
	'CHANGELOG',
	'CODE_OF_CONDUCT',
	'SECURITY',
	'CLAUDE',
];

/**
 * Remark plugin to rewrite .md links to proper site paths
 *
 * Transforms markdown links like:
 * - [Guide](guides/cli.md) → /docs/guides/cli
 * - [API](../reference/api.md) → /docs/reference/api
 * - [README](../README.md) → /README (outside /docs)
 * - [External](https://example.com) → unchanged
 *
 * This allows markdown files to use .md extensions (for GitHub viewing)
 * while rendering proper site paths in the documentation.
 *
 * @param options - Configuration options
 */
export function linksPlugin(options: LinksPluginOptions = {}) {
	const topLevelFiles = options.topLevelFiles || DEFAULT_TOP_LEVEL_FILES;

	return (tree: Root) => {
		// Guard against invalid tree
		if (!tree || typeof tree !== 'object') {
			return tree;
		}

		visit(tree, 'link', (node: Link) => {
			// Guard against undefined/null nodes or missing url
			if (!node || !node.url) {
				return;
			}

			const url = node.url;

			// Skip external links (http://, https://, mailto:, etc.)
			if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
				return;
			}

			// Skip anchor-only links
			if (url.startsWith('#')) {
				return;
			}

			// Skip already processed absolute paths
			if (url.startsWith('/docs/') || url.startsWith('/')) {
				return;
			}

			// Process .md links and relative paths
			// Split URL into path and fragment
			const [path, fragment] = url.split('#');

			// Check if this is a .md link
			const isMdLink = path.endsWith('.md');

			// Check if this is a relative path (doesn't start with http, mailto, etc.)
			const isRelativePath = !path.startsWith('../') && !path.includes('://');

			if (isMdLink || isRelativePath) {
				// Remove .md extension if present
				let rewritten = isMdLink ? path.replace(/\.md$/, '') : path;

				// Normalize path (remove ./ and resolve ../)
				rewritten = normalizePath(rewritten);

				// Ensure /docs/ prefix for documentation links
				if (!rewritten.startsWith('/') && !rewritten.startsWith('../')) {
					rewritten = `/docs/${rewritten}`;
				} else if (rewritten.startsWith('../')) {
					// Handle relative paths from /docs directory
					// Check if this is a top-level file (e.g., ../README, ../LICENSE)
					const fileName = rewritten.replace(/^\.\.\//, '').replace(/\/$/, '');
					const isTopLevelFile = topLevelFiles.some(
						(topFile) => topFile.toUpperCase() === fileName.toUpperCase()
					);

					if (isTopLevelFile) {
						// Root level files - convert to absolute path (e.g., ../README → /README)
						rewritten = `/${fileName}`;
					} else {
						// Assume it's still within docs structure
						rewritten = rewritten.replace(/^\.\.\//, '/docs/');
					}
				}

				// Re-attach fragment if it exists
				if (fragment) {
					rewritten = `${rewritten}#${fragment}`;
				}

				node.url = rewritten;
			}
		});

		return tree;
	};
}

/**
 * Normalize a path by resolving . and .. segments
 */
function normalizePath(path: string): string {
	// Split into segments
	const segments = path.split('/');
	const normalized: string[] = [];

	for (const segment of segments) {
		if (segment === '.' || segment === '') {
			continue;
		} else if (segment === '..') {
			if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
				normalized.pop();
			} else {
				normalized.push('..');
			}
		} else {
			normalized.push(segment);
		}
	}

	// Reconstruct path
	let result = normalized.join('/');

	// Preserve leading ../ segments
	if (path.startsWith('../') && !result.startsWith('../')) {
		const leadingDots = path.match(/^(\.\.\/)+/)?.[0] || '';
		result = leadingDots + result;
	}

	return result;
}
