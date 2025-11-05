/**
 * Search Index Builder
 *
 * Builds a client-side search index using MiniSearch for fast fuzzy searching
 * across documentation pages. Indexes titles, headings, descriptions, and content
 * with configurable field weights.
 */

import MiniSearch from 'minisearch';
import type { DocsSection } from './navigation.js';

/**
 * Document for search indexing
 *
 * @public
 */
export interface SearchDocument {
	id: string;
	title: string;
	description: string;
	content: string;
	href: string;
	section: string;
	headings: string[];
}

/**
 * Search result with highlighted excerpts
 *
 * @public
 */
export interface SearchResult {
	id: string;
	title: string;
	description: string;
	href: string;
	section: string;
	score: number;
	match: {
		field: string;
		excerpt: string;
	};
}

/**
 * Search index configuration
 *
 * @public
 */
export interface SearchIndexConfig {
	/** Fields to index for search */
	fields?: string[];
	/** Field weights for ranking (higher = more important) */
	fieldWeights?: Record<string, number>;
	/** Fuzzy search threshold (0-1, lower = more strict) */
	fuzzyThreshold?: number;
	/** Maximum number of results to return */
	maxResults?: number;
}

/**
 * Default search configuration
 */
const defaultConfig: Required<SearchIndexConfig> = {
	fields: ['title', 'description', 'content', 'headings', 'section'],
	fieldWeights: {
		title: 3,
		headings: 2,
		description: 1.5,
		content: 1,
		section: 0.5,
	},
	fuzzyThreshold: 0.2,
	maxResults: 10,
};

/**
 * Create a search index from documentation sections
 *
 * @param navigation - Array of documentation sections
 * @param contentMap - Map of href to full markdown content
 * @param config - Optional search configuration
 * @returns Serializable search index
 *
 * @example
 * ```typescript
 * const contentMap = new Map([
 *   ['/docs/getting-started', 'Getting started with docs-engine...'],
 *   ['/docs/features', 'Features include...']
 * ]);
 *
 * const index = createSearchIndex(navigation, contentMap);
 * ```
 *
 * @public
 */
export function createSearchIndex(
	navigation: DocsSection[],
	contentMap: Map<string, string>,
	config: SearchIndexConfig = {}
): string {
	const cfg = { ...defaultConfig, ...config };

	// Extract all documents
	const documents: SearchDocument[] = [];

	navigation.forEach((section) => {
		section.links.forEach((link) => {
			const content = contentMap.get(link.href) || '';
			const headings = extractHeadings(content);

			documents.push({
				id: link.href,
				title: link.title,
				description: link.description,
				content: stripMarkdown(content),
				href: link.href,
				section: section.title,
				headings,
			});
		});
	});

	// Create MiniSearch instance
	const miniSearch = new MiniSearch({
		fields: cfg.fields,
		storeFields: ['title', 'description', 'href', 'section'],
		searchOptions: {
			boost: cfg.fieldWeights,
			fuzzy: cfg.fuzzyThreshold,
			prefix: true,
		},
	});

	// Add documents to index
	miniSearch.addAll(documents);

	// Serialize to JSON
	return JSON.stringify(miniSearch.toJSON());
}

/**
 * Load a search index from JSON string
 *
 * @param indexJson - Serialized search index
 * @param config - Optional search configuration
 * @returns MiniSearch instance ready for searching
 *
 * @public
 */
export function loadSearchIndex(
	indexJson: string,
	config: SearchIndexConfig = {}
): MiniSearch {
	const cfg = { ...defaultConfig, ...config };

	const miniSearch = MiniSearch.loadJSON(indexJson, {
		fields: cfg.fields,
		storeFields: ['title', 'description', 'href', 'section'],
		searchOptions: {
			boost: cfg.fieldWeights,
			fuzzy: cfg.fuzzyThreshold,
			prefix: true,
		},
	});

	return miniSearch;
}

/**
 * Perform a search query
 *
 * @param miniSearch - Loaded MiniSearch instance
 * @param query - Search query string
 * @param config - Optional search configuration
 * @returns Array of search results with excerpts
 *
 * @public
 */
export function performSearch(
	miniSearch: MiniSearch,
	query: string,
	config: SearchIndexConfig = {}
): SearchResult[] {
	const cfg = { ...defaultConfig, ...config };

	if (!query.trim()) {
		return [];
	}

	const results = miniSearch.search(query, {
		boost: cfg.fieldWeights,
		fuzzy: cfg.fuzzyThreshold,
		prefix: true,
	});

	return results.slice(0, cfg.maxResults).map((result) => ({
		id: result.id as string,
		title: (result.title as string) || '',
		description: (result.description as string) || '',
		href: (result.href as string) || '',
		section: (result.section as string) || '',
		score: result.score,
		match: {
			field: getMatchedField(result.match),
			excerpt: generateExcerpt(result),
		},
	}));
}

/**
 * Extract headings from markdown content
 */
function extractHeadings(content: string): string[] {
	const headingRegex = /^#{1,6}\s+(.+)$/gm;
	const headings: string[] = [];
	let match;

	while ((match = headingRegex.exec(content)) !== null) {
		headings.push(match[1].trim());
	}

	return headings;
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(content: string): string {
	return content
		// Remove code blocks
		.replace(/```[\s\S]*?```/g, '')
		// Remove inline code
		.replace(/`[^`]+`/g, '')
		// Remove headings markers
		.replace(/^#{1,6}\s+/gm, '')
		// Remove bold/italic
		.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
		// Remove links
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		// Remove images
		.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
		// Remove horizontal rules
		.replace(/^[-*_]{3,}$/gm, '')
		// Remove HTML tags
		.replace(/<[^>]+>/g, '')
		// Normalize whitespace
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Get the field that matched in search results
 */
function getMatchedField(match: Record<string, string[]> | undefined): string {
	if (!match) return 'content';

	const fields = Object.keys(match);
	if (fields.includes('title')) return 'title';
	if (fields.includes('headings')) return 'headings';
	if (fields.includes('description')) return 'description';
	return 'content';
}

/**
 * Generate an excerpt from search results
 */
function generateExcerpt(result: unknown): string {
	const r = result as { title?: string; description?: string };

	if (r.description && r.description.length > 0) {
		return r.description.length > 120
			? r.description.substring(0, 120) + '...'
			: r.description;
	}

	if (r.title) {
		return r.title;
	}

	return '';
}

/**
 * Highlight matching text in a string
 *
 * @param text - Text to highlight
 * @param query - Search query
 * @returns Text with <mark> tags around matches
 *
 * @public
 */
export function highlightMatches(text: string, query: string): string {
	if (!query.trim()) return text;

	const terms = query
		.toLowerCase()
		.split(/\s+/)
		.filter((t) => t.length > 0);

	let highlighted = text;

	terms.forEach((term) => {
		const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
		highlighted = highlighted.replace(regex, '<mark>$1</mark>');
	});

	return highlighted;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
