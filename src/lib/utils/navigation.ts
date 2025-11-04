import type { ComponentType } from 'svelte';

/**
 * Documentation link definition
 */
export interface DocsLink {
	title: string;
	href: string;
	description: string;
	audience?: string;
}

/**
 * Documentation section with grouped links
 */
export interface DocsSection {
	title: string;
	description: string;
	icon: ComponentType;
	links: DocsLink[];
}

/**
 * Get all links from navigation structure flattened with section info
 * @param navigation - Array of documentation sections
 * @returns Flattened array of links with their section titles
 */
export function getAllLinks(navigation: DocsSection[]): Array<DocsLink & { section: string }> {
	return navigation.flatMap((section) =>
		section.links.map((link) => ({
			...link,
			section: section.title
		}))
	);
}

/**
 * Find a link by its href path
 * @param navigation - Array of documentation sections
 * @param href - The href to search for
 * @returns The matching link with section info, or undefined
 */
export function findLinkByHref(
	navigation: DocsSection[],
	href: string
): (DocsLink & { section: string }) | undefined {
	return getAllLinks(navigation).find((link) => link.href === href);
}

/**
 * Get a section by its title
 * @param navigation - Array of documentation sections
 * @param title - The section title to search for
 * @returns The matching section, or undefined
 */
export function getSectionByTitle(
	navigation: DocsSection[],
	title: string
): DocsSection | undefined {
	return navigation.find((section) => section.title === title);
}

/**
 * Get next and previous links for a given href (for pagination)
 * @param navigation - Array of documentation sections
 * @param currentHref - The current page's href
 * @returns Object with next and previous links
 */
export function getAdjacentLinks(
	navigation: DocsSection[],
	currentHref: string
): {
	previous?: DocsLink & { section: string };
	next?: DocsLink & { section: string };
} {
	const allLinks = getAllLinks(navigation);
	const currentIndex = allLinks.findIndex((link) => link.href === currentHref);

	if (currentIndex === -1) {
		return {};
	}

	return {
		previous: currentIndex > 0 ? allLinks[currentIndex - 1] : undefined,
		next: currentIndex < allLinks.length - 1 ? allLinks[currentIndex + 1] : undefined
	};
}
