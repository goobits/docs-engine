/**
 * Docs Navigation Config Stub
 *
 * Provides compatibility with DocsLayout's search functionality
 */

export interface DocsLink {
  title: string;
  href: string;
  description?: string;
}

/**
 * Returns all doc links for search functionality
 * This is a stub - search will work with whatever is in the navigation prop
 */
export function getAllDocsLinks(): DocsLink[] {
  // Return empty array - search will use the navigation prop passed to DocsLayout
  return [];
}
