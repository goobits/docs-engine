import type { DocsLink, DocsSection } from './navigation.js';

/**
 * Search result with relevance scoring
 */
export interface SearchResult extends DocsLink {
  section: string;
  score: number;
}

/**
 * Search options for fine-tuning search behavior
 */
export interface SearchOptions {
  /**
   * Maximum number of results to return
   */
  limit?: number;
  /**
   * Minimum score threshold (results below this are filtered out)
   */
  minScore?: number;
  /**
   * Weight multipliers for different match types
   */
  weights?: {
    titleMatch?: number;
    descriptionMatch?: number;
    sectionMatch?: number;
    exactMatch?: number;
    startsWithMatch?: number;
  };
}

const DEFAULT_WEIGHTS = {
  titleMatch: 10,
  descriptionMatch: 5,
  sectionMatch: 3,
  exactMatch: 20,
  startsWithMatch: 15,
};

/**
 * Search through documentation navigation structure
 * @param navigation - Array of documentation sections
 * @param query - Search query string
 * @param options - Optional search configuration
 * @returns Array of search results sorted by relevance score
 */
export function searchDocs(
  navigation: DocsSection[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const normalizedQuery = trimmedQuery.toLowerCase();
  const { limit, minScore = 0, weights = DEFAULT_WEIGHTS } = options;

  const results: SearchResult[] = [];

  for (const section of navigation) {
    for (const link of section.links) {
      let score = 0;

      const normalizedTitle = link.title.toLowerCase();
      const normalizedDescription = link.description.toLowerCase();
      const normalizedSection = section.title.toLowerCase();

      // Exact match (highest priority)
      if (normalizedTitle === normalizedQuery) {
        score += weights.exactMatch ?? DEFAULT_WEIGHTS.exactMatch;
      }

      // Starts with match (high priority)
      if (normalizedTitle.startsWith(normalizedQuery)) {
        score += weights.startsWithMatch ?? DEFAULT_WEIGHTS.startsWithMatch;
      }

      // Title contains match
      if (normalizedTitle.includes(normalizedQuery)) {
        score += weights.titleMatch ?? DEFAULT_WEIGHTS.titleMatch;

        // Bonus for word boundary matches
        const titleWords = normalizedTitle.split(/\s+/);
        if (titleWords.some((word) => word.startsWith(normalizedQuery))) {
          score += 2;
        }
      }

      // Description contains match
      if (normalizedDescription.includes(normalizedQuery)) {
        score += weights.descriptionMatch ?? DEFAULT_WEIGHTS.descriptionMatch;
      }

      // Section title contains match
      if (normalizedSection.includes(normalizedQuery)) {
        score += weights.sectionMatch ?? DEFAULT_WEIGHTS.sectionMatch;
      }

      // Add result if score is above threshold
      if (score > 0 && score >= minScore) {
        results.push({
          ...link,
          section: section.title,
          score,
        });
      }
    }
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  // Apply limit if specified
  return limit ? results.slice(0, limit) : results;
}

/**
 * Escape special regex characters
 * Module-private helper
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get search suggestions based on partial query
 * @param navigation - Array of documentation sections
 * @param query - Partial search query
 * @param limit - Maximum number of suggestions
 * @returns Array of suggested search terms
 */
export function getSearchSuggestions(
  navigation: DocsSection[],
  query: string,
  limit = 5
): string[] {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  for (const section of navigation) {
    for (const link of section.links) {
      // Suggest complete titles that start with the query
      if (link.title.toLowerCase().startsWith(normalizedQuery)) {
        suggestions.add(link.title);
      }

      // Suggest individual words from titles that start with the query
      const words = link.title.split(/\s+/);
      for (const word of words) {
        if (word.toLowerCase().startsWith(normalizedQuery) && word.length > query.length) {
          suggestions.add(word);
        }
      }
    }
  }

  return Array.from(suggestions).slice(0, limit);
}
