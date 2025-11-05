import type { DocsSection } from './navigation.js';
import type { SearchDocument } from './search-index.js';

/**
 * Meilisearch document for indexing
 * Compatible with Meilisearch's format
 *
 * @public
 */
export interface MeilisearchDocument {
	id: string;
	title: string;
	description: string;
	content: string;
	href: string;
	section: string;
	headings: string[];
	locale?: string;
	/** Timestamp for freshness ranking */
	_timestamp?: number;
}

/**
 * Build Meilisearch documents from navigation and content
 *
 * Creates documents optimized for Meilisearch indexing with:
 * - Primary content fields (title, description, content)
 * - Navigation context (section, href)
 * - Structured headings for better matching
 * - Optional locale for multi-language support
 *
 * @param navigation - Documentation sections
 * @param contentMap - Map of href to full markdown content
 * @param locale - Optional locale code for multi-language sites
 * @returns Array of Meilisearch documents ready for indexing
 *
 * @example
 * ```typescript
 * const docs = buildMeilisearchDocuments(navigation, contentMap, 'en');
 * // Upload to Meilisearch using their SDK
 * await meiliClient.index('docs').addDocuments(docs);
 * ```
 *
 * @public
 */
export function buildMeilisearchDocuments(
	navigation: DocsSection[],
	contentMap: Map<string, string>,
	locale?: string
): MeilisearchDocument[] {
	const documents: MeilisearchDocument[] = [];
	const timestamp = Date.now();

	navigation.forEach((section) => {
		section.links.forEach((link) => {
			const content = contentMap.get(link.href) || '';
			const headings = extractHeadings(content);
			const cleanContent = stripMarkdown(content);

			const doc: MeilisearchDocument = {
				id: link.href,
				title: link.title,
				description: link.description,
				content: cleanContent,
				href: link.href,
				section: section.title,
				headings,
				_timestamp: timestamp
			};

			if (locale) {
				doc.locale = locale;
			}

			documents.push(doc);
		});
	});

	return documents;
}

/**
 * Generate Meilisearch index settings
 *
 * Returns recommended settings for optimal search experience:
 * - Searchable attributes with proper ranking
 * - Filterable attributes for faceting
 * - Sortable attributes for result ordering
 * - Ranking rules for relevance
 *
 * @param options - Optional settings customization
 * @returns Meilisearch settings object
 *
 * @example
 * ```typescript
 * const settings = getMeilisearchSettings();
 * await meiliClient.index('docs').updateSettings(settings);
 * ```
 *
 * @public
 */
export function getMeilisearchSettings(options: {
	enableLocaleFilter?: boolean;
} = {}): Record<string, unknown> {
	const { enableLocaleFilter = false } = options;

	const filterableAttributes = ['section', 'href'];
	if (enableLocaleFilter) {
		filterableAttributes.push('locale');
	}

	return {
		searchableAttributes: [
			'title',
			'headings',
			'description',
			'content',
			'section'
		],
		filterableAttributes,
		sortableAttributes: ['_timestamp'],
		rankingRules: [
			'words',
			'typo',
			'proximity',
			'attribute',
			'sort',
			'exactness'
		],
		typoTolerance: {
			enabled: true,
			minWordSizeForTypos: {
				oneTypo: 4,
				twoTypos: 8
			}
		}
	};
}

/**
 * Extract headings from markdown content
 *
 * Module-private helper - not exported
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
 *
 * Module-private helper - not exported
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
