import type { Plugin, Transformer } from 'unified';
import type { Root, Heading, List, ListItem } from 'mdast';

/**
 * Creates a remark plugin that generates a table of contents (TOC) from markdown headings
 * @returns A unified plugin
 */
export function remarkTableOfContents() {
	return (tree: Root) => {
		/** @type {Array<{depth: number, text: string, id: string}>} */
		const headings: Array<{ depth: number; text: string; id: string }> = [];
		let tocIndex = -1;
		let tocDepth = 2; // Default depth if not specified
		let tocLevel = 2; // Level of the TOC heading itself

		// First pass: find TOC marker
		tree.children.forEach((node, index) => {
			if (node.type === 'heading') {
				const firstChild = node.children[0];
				const headingText =
					firstChild && 'value' in firstChild ? (firstChild.value as string) : '';

				// Check for new TOC format (## TOC:2)
				const tocMatch = headingText.match(/^TOC(?::(\d+))?$/);
				if (tocMatch) {
					tocIndex = index;
					tocLevel = node.depth;

					// If a depth is specified (e.g., TOC:3), use it
					// If just TOC with no number, use default depth
					if (tocMatch[1]) {
						tocDepth = Math.min(6, Math.max(0, parseInt(tocMatch[1], 10)));
					}

					// Special case: if depth is 0, include all levels
					if (tocDepth === 0) {
						tocDepth = 6;
					}
					return;
				}

				// Only collect headings that come after TOC marker
				if (tocIndex !== -1 && index > tocIndex) {
					const id = toId(headingText);
					node.data = {
						hProperties: { id }
					};

					headings.push({
						depth: node.depth,
						text: headingText,
						id
					});
				}
			}
		});

		// If we found a TOC marker
		if (tocIndex !== -1) {
			// Create TOC heading
			const tocHeading: Heading = {
				type: 'heading',
				depth: tocLevel as 1 | 2 | 3 | 4 | 5 | 6,
				children: [
					{
						type: 'text',
						value: 'Table of Contents'
					}
				]
			};

			// Filter headings by depth
			const filteredHeadings = headings.filter((h) => h.depth <= tocDepth);

			// Create nested TOC list with proper hierarchy
			const tocList: List = buildNestedTocList(filteredHeadings);

			// Replace TOC marker with heading and list
			tree.children.splice(tocIndex, 1, tocHeading, tocList);
		}
	};
}

/**
 * Builds a nested TOC list from flat headings array
 * @param {Array<{depth: number, text: string, id: string}>} headings - Flat array of headings
 * @returns {List} Nested list structure with proper hierarchy
 * @private
 */
function buildNestedTocList(
	headings: Array<{ depth: number; text: string; id: string }>
): List {
	if (headings.length === 0) {
		return {
			type: 'list',
			ordered: false,
			children: []
		};
	}

	// Find the minimum depth (root level)
	const minDepth = Math.min(...headings.map((h) => h.depth));

	// Build nested structure
	const buildLevel = (
		items: Array<{ depth: number; text: string; id: string }>,
		currentDepth: number
	): ListItem[] => {
		const result: ListItem[] = [];
		let i = 0;

		while (i < items.length) {
			const heading = items[i];

			// Skip if depth is less than current level (shouldn't happen)
			if (heading.depth < currentDepth) {
				i++;
				continue;
			}

			// Skip if depth is greater than current level (will be handled recursively)
			if (heading.depth > currentDepth) {
				break;
			}

			// Create list item for current heading
			const listItem: ListItem = {
				type: 'listItem',
				children: [
					{
						type: 'paragraph',
						children: [
							{
								type: 'link',
								url: `#${heading.id}`,
								children: [
									{
										type: 'text',
										value: heading.text
									}
								]
							}
						]
					}
				]
			};

			// Look ahead for child headings (deeper depth)
			i++;
			const childHeadings: Array<{ depth: number; text: string; id: string }> = [];
			while (i < items.length && items[i].depth > currentDepth) {
				childHeadings.push(items[i]);
				i++;
			}

			// If there are child headings, create nested list
			if (childHeadings.length > 0) {
				const childDepth = Math.min(...childHeadings.map((h) => h.depth));
				const nestedList: List = {
					type: 'list',
					ordered: false,
					children: buildLevel(childHeadings, childDepth)
				};
				listItem.children.push(nestedList);
			}

			result.push(listItem);
		}

		return result;
	};

	return {
		type: 'list',
		ordered: false,
		children: buildLevel(headings, minDepth)
	};
}

/**
 * Converts text to a URL-friendly ID
 * @param {string} text - The text to convert
 * @returns {string} The converted text as a lowercase, hyphen-separated string
 * @private
 */
function toId(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}
