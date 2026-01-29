import { describe, it, expect } from 'vitest';
import {
  getAllLinks,
  findLinkByHref,
  getSectionByTitle,
  getAdjacentLinks,
  type DocsSection,
} from './navigation';
import type { ComponentType } from 'svelte';

/** Mock icon component for testing */
const MockIcon = (() => null) as unknown as ComponentType;

const mockNavigation: DocsSection[] = [
  {
    title: 'Getting Started',
    description: 'Get started with docs-engine',
    icon: MockIcon,
    links: [
      { title: 'Installation', href: '/docs/installation', description: 'Install docs-engine' },
      {
        title: 'Quick Start',
        href: '/docs/quick-start',
        description: 'Get started quickly',
      },
    ],
  },
  {
    title: 'Features',
    description: 'Core features',
    icon: MockIcon,
    links: [
      { title: 'Search', href: '/docs/features/search', description: 'Search functionality' },
      {
        title: 'Navigation',
        href: '/docs/features/navigation',
        description: 'Navigation features',
      },
    ],
  },
];

describe('navigation utilities', () => {
  describe('getAllLinks', () => {
    it('should return all links from all sections', () => {
      const links = getAllLinks(mockNavigation);
      expect(links).toHaveLength(4);
      expect(links[0].title).toBe('Installation');
      expect(links[0].section).toBe('Getting Started');
    });

    it('should include section information for each link', () => {
      const links = getAllLinks(mockNavigation);
      links.forEach((link) => {
        expect(link).toHaveProperty('section');
        expect(typeof link.section).toBe('string');
      });
    });
  });

  describe('findLinkByHref', () => {
    it('should find a link by exact href match', () => {
      const link = findLinkByHref(mockNavigation, '/docs/quick-start');
      expect(link).toBeDefined();
      expect(link?.title).toBe('Quick Start');
      expect(link?.section).toBe('Getting Started');
    });

    it('should return undefined for non-existent href', () => {
      const link = findLinkByHref(mockNavigation, '/docs/non-existent');
      expect(link).toBeUndefined();
    });
  });

  describe('getSectionByTitle', () => {
    it('should find a section by title', () => {
      const section = getSectionByTitle(mockNavigation, 'Features');
      expect(section).toBeDefined();
      expect(section?.title).toBe('Features');
      expect(section?.links).toHaveLength(2);
    });

    it('should return undefined for non-existent section', () => {
      const section = getSectionByTitle(mockNavigation, 'Non-existent');
      expect(section).toBeUndefined();
    });
  });

  describe('getAdjacentLinks', () => {
    it('should return next link for first page', () => {
      const result = getAdjacentLinks(mockNavigation, '/docs/installation');
      expect(result.previous).toBeUndefined();
      expect(result.next).toBeDefined();
      expect(result.next?.title).toBe('Quick Start');
    });

    it('should return both previous and next for middle page', () => {
      const result = getAdjacentLinks(mockNavigation, '/docs/quick-start');
      expect(result.previous).toBeDefined();
      expect(result.previous?.title).toBe('Installation');
      expect(result.next).toBeDefined();
      expect(result.next?.title).toBe('Search');
    });

    it('should return previous link for last page', () => {
      const result = getAdjacentLinks(mockNavigation, '/docs/features/navigation');
      expect(result.previous).toBeDefined();
      expect(result.previous?.title).toBe('Search');
      expect(result.next).toBeUndefined();
    });

    it('should return empty object for non-existent page', () => {
      const result = getAdjacentLinks(mockNavigation, '/docs/non-existent');
      expect(result.previous).toBeUndefined();
      expect(result.next).toBeUndefined();
    });
  });
});
