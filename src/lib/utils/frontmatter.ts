import { parse as parseYaml } from 'yaml';

/**
 * Frontmatter metadata
 */
export interface Frontmatter {
	title?: string;
	description?: string;
	date?: string;
	author?: string;
	tags?: string[];
	categories?: string[];
	draft?: boolean;
	order?: number;
	[key: string]: any; // Allow custom fields
}

/**
 * Parsed content with frontmatter
 */
export interface ParsedContent {
	frontmatter: Frontmatter;
	content: string;
	raw: string;
}

/**
 * Extract and parse YAML frontmatter from markdown
 *
 * Supports:
 * ---
 * title: "My Doc"
 * date: "2025-01-01"
 * tags: ["guide", "api"]
 * ---
 *
 * # Content here
 *
 * @param markdown - Raw markdown string with optional frontmatter
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(markdown: string): ParsedContent {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
	const match = markdown.match(frontmatterRegex);

	if (!match) {
		return {
			frontmatter: {},
			content: markdown,
			raw: markdown
		};
	}

	try {
		const frontmatterYaml = match[1];
		const frontmatter = parseYaml(frontmatterYaml) as Frontmatter;
		const content = markdown.slice(match[0].length);

		return {
			frontmatter,
			content,
			raw: markdown
		};
	} catch (error) {
		console.error('Failed to parse frontmatter:', error);
		return {
			frontmatter: {},
			content: markdown,
			raw: markdown
		};
	}
}

/**
 * Extract title from frontmatter or first heading
 *
 * Priority:
 * 1. frontmatter.title
 * 2. First # heading in content
 * 3. Fallback string
 *
 * @param frontmatter - Parsed frontmatter
 * @param content - Markdown content without frontmatter
 * @param fallback - Fallback title if none found
 * @returns Extracted title
 */
export function extractTitle(
	frontmatter: Frontmatter,
	content: string,
	fallback: string
): string {
	// Priority 1: Frontmatter title
	if (frontmatter.title) {
		return frontmatter.title;
	}

	// Priority 2: First # heading
	const titleMatch = content.match(/^#\s+(.+)$/m);
	if (titleMatch) {
		return titleMatch[1];
	}

	// Priority 3: Fallback
	return fallback;
}
