import { describe, it, expect } from 'vitest';
import {
  createSearchIndex,
  loadSearchIndex,
  performSearch,
  highlightMatches,
} from './search-index';
import type { DocsSection as NavSection } from './navigation';

describe('search-index utilities', () => {
  const mockNavigation: NavSection[] = [
    {
      title: 'Getting Started',
      description: 'Get started docs',
      icon: (() => null) as any,
      links: [
        {
          title: 'Installation Guide',
          href: '/docs/installation',
          description: 'Learn how to install docs-engine',
        },
        {
          title: 'Quick Start Tutorial',
          href: '/docs/quick-start',
          description: 'Get started quickly with examples',
        },
      ],
    },
    {
      title: 'Features',
      description: 'Core features',
      icon: (() => null) as any,
      links: [
        {
          title: 'Search Functionality',
          href: '/docs/search',
          description: 'Powerful search capabilities',
        },
      ],
    },
  ];

  const mockContentMap = new Map([
    [
      '/docs/installation',
      '# Installation\n\nInstall docs-engine using npm or pnpm.\n\n```bash\nnpm install docs-engine\n```',
    ],
    [
      '/docs/quick-start',
      '# Quick Start\n\nGet started with docs-engine in minutes.\n\n## Setup\n\nCreate a new project.',
    ],
    [
      '/docs/search',
      '# Search\n\nDocs-engine includes powerful search.\n\n## Features\n\nFuzzy matching.',
    ],
  ]);

  describe('createSearchIndex', () => {
    it('should create a valid search index', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      expect(indexJson).toBeDefined();
      expect(typeof indexJson).toBe('string');
      expect(indexJson.length).toBeGreaterThan(0);
    });

    it('should create parseable JSON', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      expect(() => JSON.parse(indexJson)).not.toThrow();
    });
  });

  describe('loadSearchIndex', () => {
    it('should load a search index from JSON', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      expect(miniSearch).toBeDefined();
    });

    it('should create searchable index', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      const results = miniSearch.search('installation');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('performSearch', () => {
    it('should return empty array for empty query', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      const results = performSearch(miniSearch, '');
      expect(results).toEqual([]);
    });

    it('should find exact title matches', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      const results = performSearch(miniSearch, 'Installation');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Installation');
    });

    it('should perform fuzzy search', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      const results = performSearch(miniSearch, 'instal'); // Fuzzy match
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect maxResults configuration', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      const results = performSearch(miniSearch, 'docs', { maxResults: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should include href and section in results', () => {
      const indexJson = createSearchIndex(mockNavigation, mockContentMap);
      const miniSearch = loadSearchIndex(indexJson);
      const results = performSearch(miniSearch, 'installation');
      expect(results[0]).toHaveProperty('href');
      expect(results[0]).toHaveProperty('section');
      expect(results[0]).toHaveProperty('title');
    });
  });

  describe('highlightMatches', () => {
    it('should wrap matching text in mark tags', () => {
      const text = 'This is a test document';
      const highlighted = highlightMatches(text, 'test');
      expect(highlighted).toContain('<mark>test</mark>');
    });

    it('should be case insensitive', () => {
      const text = 'Installation Guide';
      const highlighted = highlightMatches(text, 'installation');
      expect(highlighted).toContain('<mark>');
    });

    it('should handle multiple matches', () => {
      const text = 'test test test';
      const highlighted = highlightMatches(text, 'test');
      const matchCount = (highlighted.match(/<mark>/g) || []).length;
      expect(matchCount).toBe(3);
    });

    it('should handle empty query', () => {
      const text = 'Some text';
      const highlighted = highlightMatches(text, '');
      expect(highlighted).toBe(text);
    });

    it('should handle special regex characters', () => {
      const text = 'Price: $100.00';
      const highlighted = highlightMatches(text, '$');
      expect(highlighted).toContain('<mark>$</mark>');
    });
  });
});
