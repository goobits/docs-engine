/**
 * Navigation Utilities
 *
 * Provides functions for navigating documentation pages
 */

export interface DocsLink {
  title: string;
  href: string;
  category?: string;
  order?: number;
}

/**
 * Get adjacent links (previous and next) for a given URL
 * Handles both flat arrays and nested navigation structures
 */
export function getAdjacentLinks(
  currentUrl: string,
  allLinks: any // Can be DocsLink[] or nested navigation structure
): { prev?: DocsLink; next?: DocsLink } {
  // Flatten nested navigation if needed
  let flatLinks: DocsLink[] = [];

  if (Array.isArray(allLinks)) {
    // Check if it's a nested structure with sections
    if (allLinks.length > 0 && allLinks[0].links) {
      // Flatten sections into a single array
      for (const section of allLinks) {
        if (section.links && Array.isArray(section.links)) {
          flatLinks = flatLinks.concat(section.links);
        }
      }
    } else {
      // Already a flat array
      flatLinks = allLinks;
    }
  } else {
    // Not an array, can't find adjacent links
    return {};
  }

  const currentIndex = flatLinks.findIndex((link) => link.href === currentUrl);

  if (currentIndex === -1) {
    return {};
  }

  return {
    prev: currentIndex > 0 ? flatLinks[currentIndex - 1] : undefined,
    next: currentIndex < flatLinks.length - 1 ? flatLinks[currentIndex + 1] : undefined,
  };
}
