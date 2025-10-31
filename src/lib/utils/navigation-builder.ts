import { parse as parseYaml } from 'yaml';
import type { DocsSection, DocsLink } from './navigation.js';
import type { ComponentType } from 'svelte';

/**
 * Frontmatter metadata extracted from markdown files
 */
export interface DocFrontmatter {
	title?: string;
	description?: string;
	order?: number;
	section?: string;
	icon?: string;
	hidden?: boolean;
}

/**
 * Document file with path and content
 */
export interface DocFile {
	/** Relative path from docs root (e.g., "quick-start.md" or "dsl/fundamentals.md") */
	path: string;
	/** Full markdown content including frontmatter */
	content: string;
	/** URL href (e.g., "/docs/quick-start") */
	href: string;
}

/**
 * Icon mapping from string names to icon components
 */
export type IconMap = Record<string, ComponentType>;

/**
 * Options for building navigation tree
 */
export interface NavigationBuilderOptions {
	/** Base URL path (default: "/docs") */
	basePath?: string;
	/** Icon components map */
	icons?: IconMap;
	/** Default icon if none specified */
	defaultIcon?: ComponentType;
	/** Default section name for ungrouped docs */
	defaultSection?: string;
	/** Default section description */
	defaultSectionDescription?: string;
}

/**
 * Extract frontmatter from markdown content
 */
export function extractFrontmatter(content: string): {
	frontmatter: DocFrontmatter;
	body: string;
} {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return {
			frontmatter: {},
			body: content,
		};
	}

	try {
		const frontmatter = parseYaml(match[1]) as DocFrontmatter;
		const body = match[2];
		return { frontmatter, body };
	} catch (err) {
		console.warn('Failed to parse frontmatter:', err);
		return {
			frontmatter: {},
			body: content,
		};
	}
}

/**
 * Generate title from file path if not provided in frontmatter
 */
function generateTitleFromPath(path: string): string {
	// Remove .md extension and get filename
	const filename = path.replace(/\.md$/, '').split('/').pop() || '';

	// Convert kebab-case or snake_case to Title Case
	return filename
		.replace(/[-_]/g, ' ')
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Extract first paragraph from markdown body as description
 */
function extractDescriptionFromBody(body: string): string {
	// Remove headings
	const withoutHeadings = body.replace(/^#+\s+.+$/gm, '');

	// Get first paragraph
	const firstParagraph = withoutHeadings
		.trim()
		.split('\n\n')[0]
		?.replace(/\n/g, ' ')
		.trim();

	// Truncate if too long
	if (!firstParagraph) return '';
	return firstParagraph.length > 150
		? firstParagraph.substring(0, 147) + '...'
		: firstParagraph;
}

/**
 * Build navigation tree from document files
 *
 * This function processes an array of document files with frontmatter
 * and builds a structured navigation tree suitable for DocsSidebar.
 *
 * @param files - Array of document files with path, content, and href
 * @param options - Configuration options
 * @returns Array of documentation sections
 *
 * @example
 * ```typescript
 * import { buildNavigation } from '@goobits/docs-engine/utils';
 * import { BookOpen, Code } from 'lucide-svelte';
 *
 * const files = [
 *   {
 *     path: 'quick-start.md',
 *     content: '---\ntitle: Quick Start\nsection: Getting Started\n---\n...',
 *     href: '/docs/quick-start'
 *   }
 * ];
 *
 * const navigation = buildNavigation(files, {
 *   icons: {
 *     'Getting Started': BookOpen,
 *     'DSL': Code
 *   }
 * });
 * ```
 */
export function buildNavigation(
	files: DocFile[],
	options: NavigationBuilderOptions = {}
): DocsSection[] {
	const {
		icons = {},
		defaultIcon,
		defaultSection = 'Documentation',
		defaultSectionDescription = 'Documentation pages',
	} = options;

	// Parse all files and extract metadata
	const docs = files
		.map((file) => {
			const { frontmatter, body } = extractFrontmatter(file.content);

			// Skip hidden files
			if (frontmatter.hidden) return null;

			const title = frontmatter.title || generateTitleFromPath(file.path);
			const description =
				frontmatter.description || extractDescriptionFromBody(body);
			const section = frontmatter.section || defaultSection;
			const order = frontmatter.order ?? 999; // Default to end if no order

			return {
				title,
				description,
				section,
				order,
				href: file.href,
			};
		})
		.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

	// Group by section
	const sectionMap = new Map<string, DocsLink[]>();

	for (const doc of docs) {
		if (!sectionMap.has(doc.section)) {
			sectionMap.set(doc.section, []);
		}

		sectionMap.get(doc.section)!.push({
			title: doc.title,
			description: doc.description,
			href: doc.href,
		});
	}

	// Build DocsSection array
	const sections: DocsSection[] = [];

	for (const [sectionTitle, links] of sectionMap.entries()) {
		// Sort links by order (from frontmatter)
		const sortedLinks = links.sort((a, b) => {
			// Find original doc to get order
			const docA = docs.find((d) => d.href === a.href);
			const docB = docs.find((d) => d.href === b.href);
			return (docA?.order ?? 999) - (docB?.order ?? 999);
		});

		sections.push({
			title: sectionTitle,
			description:
				sectionTitle === defaultSection
					? defaultSectionDescription
					: `${sectionTitle} documentation`,
			icon: icons[sectionTitle] || defaultIcon || (() => null),
			links: sortedLinks,
		});
	}

	// Sort sections by the minimum order of their links
	sections.sort((a, b) => {
		const minOrderA = Math.min(
			...a.links.map((link) => docs.find((d) => d.href === link.href)?.order ?? 999)
		);
		const minOrderB = Math.min(
			...b.links.map((link) => docs.find((d) => d.href === link.href)?.order ?? 999)
		);
		return minOrderA - minOrderB;
	});

	return sections;
}

/**
 * Utility to create DocFile objects from filesystem
 * Call this from your SvelteKit server code, not from docs-engine
 *
 * @example
 * ```typescript
 * // In your +layout.server.ts or similar
 * import { readdirSync, readFileSync } from 'fs';
 * import { createDocFile } from '@goobits/docs-engine/utils';
 *
 * const files = readdirSync('/workspace/docs')
 *   .filter(name => name.endsWith('.md'))
 *   .map(name => createDocFile({
 *     path: name,
 *     content: readFileSync(`/workspace/docs/${name}`, 'utf-8'),
 *     basePath: '/docs'
 *   }));
 * ```
 */
export function createDocFile(params: {
	path: string;
	content: string;
	basePath?: string;
}): DocFile {
	const { path, content, basePath = '/docs' } = params;

	// Convert file path to URL href
	// Examples:
	//   "quick-start.md" -> "/docs/quick-start"
	//   "dsl/fundamentals.md" -> "/docs/dsl/fundamentals"
	const href = `${basePath}/${path.replace(/\.md$/, '')}`;

	return { path, content, href };
}
