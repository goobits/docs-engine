import { describe, it, expect } from 'vitest';
import { searchDocs, getSearchSuggestions, type SearchResult } from './search';
import type { DocsSection } from './navigation';
import type { ComponentType } from 'svelte';

/** Mock icon component for testing */
const MockIcon = (() => null) as unknown as ComponentType;

/**
 * Small in-memory fixture covering title/description/section matches.
 * Kept intentionally minimal so scoring math is easy to reason about.
 */
const mockNavigation: DocsSection[] = [
  {
    title: 'Getting Started',
    description: 'Get started with docs-engine',
    icon: MockIcon,
    links: [
      {
        title: 'Installation',
        href: '/docs/installation',
        description: 'Install docs-engine on your machine',
      },
      {
        title: 'Quick Start',
        href: '/docs/quick-start',
        description: 'Get up and running quickly',
      },
    ],
  },
  {
    title: 'Search Features',
    description: 'Everything about search',
    icon: MockIcon,
    links: [
      {
        title: 'Search',
        href: '/docs/features/search',
        description: 'Full text search functionality',
      },
      {
        title: 'Navigation',
        href: '/docs/features/navigation',
        description: 'Move between pages and search results',
      },
    ],
  },
];

describe('searchDocs', () => {
  describe('basic matching', () => {
    it('matches by link title', () => {
      const results = searchDocs(mockNavigation, 'Installation');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Installation');
      expect(results[0].href).toBe('/docs/installation');
    });

    it('matches by link description', () => {
      const results = searchDocs(mockNavigation, 'machine');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Installation');
    });

    it('matches by section title', () => {
      // "Search Features" is a section title; only the "Navigation" link in it
      // does not contain "features" in title/description, so it matches via section.
      const results = searchDocs(mockNavigation, 'Features');
      const hrefs = results.map((r) => r.href);
      expect(hrefs).toContain('/docs/features/search');
      expect(hrefs).toContain('/docs/features/navigation');
    });

    it('includes section title on each result', () => {
      const results = searchDocs(mockNavigation, 'Installation');
      expect(results[0].section).toBe('Getting Started');
    });

    it('returns results carrying through the original link fields', () => {
      const results = searchDocs(mockNavigation, 'Navigation');
      const nav = results.find((r) => r.href === '/docs/features/navigation');
      expect(nav).toBeDefined();
      expect(nav?.description).toBe('Move between pages and search results');
    });
  });

  describe('case-insensitivity and partial matches', () => {
    it('is case-insensitive for the query', () => {
      const lower = searchDocs(mockNavigation, 'installation');
      const upper = searchDocs(mockNavigation, 'INSTALLATION');
      const mixed = searchDocs(mockNavigation, 'InStAlLaTiOn');
      expect(lower.map((r) => r.href)).toEqual(['/docs/installation']);
      expect(upper.map((r) => r.href)).toEqual(['/docs/installation']);
      expect(mixed.map((r) => r.href)).toEqual(['/docs/installation']);
    });

    it('matches partial / substring queries within a title', () => {
      const results = searchDocs(mockNavigation, 'stall');
      expect(results.map((r) => r.href)).toEqual(['/docs/installation']);
    });

    it('trims surrounding whitespace before matching', () => {
      const results = searchDocs(mockNavigation, '   Installation   ');
      expect(results.map((r) => r.href)).toEqual(['/docs/installation']);
    });
  });

  describe('ranking and ordering', () => {
    it('ranks a title match above a description-only match', () => {
      // Query "search": "Search" link matches title (exact + startsWith + includes
      // + word bonus = high). "Navigation" link matches only in description.
      // "Search Features" section title also boosts the Search-section links.
      const results = searchDocs(mockNavigation, 'search');
      expect(results[0].title).toBe('Search');

      const searchResult = results.find((r) => r.title === 'Search')!;
      const navResult = results.find((r) => r.title === 'Navigation')!;
      expect(searchResult.score).toBeGreaterThan(navResult.score);
    });

    it('scores an exact title match higher than a mere substring title match', () => {
      const results = searchDocs(mockNavigation, 'search');
      // "Search" is an exact title hit; it should outrank any non-exact match.
      const exact = results.find((r) => r.title === 'Search')!;
      const others = results.filter((r) => r.title !== 'Search');
      for (const other of others) {
        expect(exact.score).toBeGreaterThan(other.score);
      }
    });

    it('returns results sorted by descending score', () => {
      const results = searchDocs(mockNavigation, 'search');
      const scores = results.map((r) => r.score);
      const sorted = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sorted);
    });

    it('gives an exact title match the documented combined score', () => {
      // For the "Search" link with query "search":
      //   exact title (20) + startsWith (15) + title includes (10) + word bonus (2)
      //   + description "Full text search functionality" includes (5)
      //   + section "Search Features" includes (3) = 55.
      const results = searchDocs(mockNavigation, 'search');
      const exact = results.find((r) => r.title === 'Search')!;
      expect(exact.score).toBe(55);
    });
  });

  describe('options', () => {
    it('limits the number of results returned', () => {
      const all = searchDocs(mockNavigation, 'search');
      expect(all.length).toBeGreaterThan(1);

      const limited = searchDocs(mockNavigation, 'search', { limit: 1 });
      expect(limited).toHaveLength(1);
      // The single result kept is the highest-scoring one.
      expect(limited[0].title).toBe('Search');
    });

    it('filters out results below minScore', () => {
      // Description-only matches score 5; raising minScore above that drops them.
      const results = searchDocs(mockNavigation, 'search', { minScore: 10 });
      const titles = results.map((r) => r.title);
      expect(titles).not.toContain('Navigation');
      expect(titles).toContain('Search');
    });

    it('returns empty when minScore exceeds every score', () => {
      const results = searchDocs(mockNavigation, 'search', { minScore: 1000 });
      expect(results).toEqual([]);
    });

    it('applies custom weights to scoring', () => {
      const base = searchDocs(mockNavigation, 'machine');
      const boosted = searchDocs(mockNavigation, 'machine', {
        weights: { descriptionMatch: 99 },
      });
      const baseScore = base.find((r) => r.title === 'Installation')!.score;
      const boostedScore = boosted.find((r) => r.title === 'Installation')!.score;
      expect(boostedScore).toBeGreaterThan(baseScore);
      expect(boostedScore).toBe(99);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for an empty query', () => {
      expect(searchDocs(mockNavigation, '')).toEqual([]);
    });

    it('returns empty array for a whitespace-only query', () => {
      expect(searchDocs(mockNavigation, '    ')).toEqual([]);
    });

    it('returns empty array when nothing matches', () => {
      expect(searchDocs(mockNavigation, 'zzzznothinghere')).toEqual([]);
    });

    it('returns empty array for empty navigation', () => {
      expect(searchDocs([], 'search')).toEqual([]);
    });

    it('handles sections that have no links', () => {
      const nav: DocsSection[] = [
        { title: 'Empty', description: 'no links', icon: MockIcon, links: [] },
      ];
      expect(searchDocs(nav, 'anything')).toEqual([]);
    });

    it('does not mutate the input navigation', () => {
      const snapshot = JSON.stringify(mockNavigation);
      searchDocs(mockNavigation, 'search', { limit: 1 });
      expect(JSON.stringify(mockNavigation)).toBe(snapshot);
    });

    it('returns objects shaped like SearchResult', () => {
      const results = searchDocs(mockNavigation, 'Installation');
      const result: SearchResult = results[0];
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('href');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('section');
      expect(typeof result.score).toBe('number');
    });
  });
});

describe('getSearchSuggestions', () => {
  it('suggests full titles that start with the query', () => {
    const suggestions = getSearchSuggestions(mockNavigation, 'Inst');
    expect(suggestions).toContain('Installation');
  });

  it('is case-insensitive', () => {
    const suggestions = getSearchSuggestions(mockNavigation, 'inst');
    expect(suggestions).toContain('Installation');
  });

  it('suggests individual words from multi-word titles', () => {
    // "Quick Start" -> word "Start" starts with "sta".
    const suggestions = getSearchSuggestions(mockNavigation, 'sta');
    expect(suggestions).toContain('Start');
  });

  it('deduplicates suggestions', () => {
    const suggestions = getSearchSuggestions(mockNavigation, 'sea');
    const unique = new Set(suggestions);
    expect(suggestions.length).toBe(unique.size);
  });

  it('respects the limit argument', () => {
    const suggestions = getSearchSuggestions(mockNavigation, 's', 1);
    expect(suggestions).toHaveLength(1);
  });

  it('defaults to at most 5 suggestions', () => {
    const suggestions = getSearchSuggestions(mockNavigation, 's');
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('returns empty array for empty query', () => {
    expect(getSearchSuggestions(mockNavigation, '')).toEqual([]);
  });

  it('returns empty array for whitespace-only query', () => {
    expect(getSearchSuggestions(mockNavigation, '   ')).toEqual([]);
  });

  it('returns empty array when no titles or words match', () => {
    expect(getSearchSuggestions(mockNavigation, 'zzzz')).toEqual([]);
  });

  it('returns empty array for empty navigation', () => {
    expect(getSearchSuggestions([], 'inst')).toEqual([]);
  });

  it('only suggests words strictly longer than the query', () => {
    // Querying the full word "Search" should not re-add "Search" as a word
    // suggestion (word.length is not > query.length), though the full-title
    // branch still adds the "Search" title.
    const suggestions = getSearchSuggestions(mockNavigation, 'Search');
    expect(suggestions).toContain('Search');
    // No accidental duplicate of the same string.
    expect(suggestions.filter((s) => s === 'Search')).toHaveLength(1);
  });
});
