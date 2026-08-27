/**
 * Sitemap Generation Utility
 *
 * Generates sitemap.xml from documentation navigation structure.
 * Supports custom priorities, exclusions, and last modified dates.
 */

import { buildSitemapXml } from '@goobits/sitemap/server';
import type { SitemapRoute } from '@goobits/sitemap/core';
import type { DocsSection } from '../utils/navigation.ts';

/**
 * Sitemap configuration
 *
 * @public
 */
export interface SitemapConfig {
  /** Base URL for the site (e.g., "https://example.com") */
  siteUrl: string;
  /** Default priority for pages (0.0-1.0) */
  defaultPriority?: number;
  /** Default change frequency */
  defaultChangefreq?: 'daily' | 'weekly' | 'monthly';
  /** Custom last modified dates (map of href to ISO date string) */
  lastModified?: Map<string, string>;
}

/**
 * Generate sitemap.xml from navigation structure
 *
 * @param navigation - Array of documentation sections
 * @param config - Sitemap configuration
 * @returns XML string for sitemap.xml
 *
 * @example
 * ```typescript
 * const sitemap = generateSitemap(navigation, {
 *   siteUrl: 'https://docs.example.com',
 *   defaultPriority: 0.8
 * });
 * ```
 *
 * @public
 */
export function generateSitemap(navigation: DocsSection[], config: SitemapConfig): string {
  const {
    siteUrl,
    defaultPriority = 0.7,
    defaultChangefreq = 'weekly',
    lastModified = new Map(),
  } = config;

  const routes: SitemapRoute[] = navigation.flatMap((section) =>
    section.links.map((link) => {
      const modified = lastModified.get(link.href);
      return {
        path: link.href,
        lastModified: modified ?? '',
        changefreq: defaultChangefreq,
        priority: defaultPriority,
      };
    })
  );

  return buildSitemapXml(siteUrl, routes);
}

/**
 * Generate robots.txt content
 *
 * @param config - Robots configuration
 * @returns robots.txt content
 *
 * @example
 * ```typescript
 * const robots = generateRobotsTxt({
 *   siteUrl: 'https://docs.example.com',
 *   disallow: ['/api/*', '/internal/*']
 * });
 * ```
 *
 * @public
 */
export function generateRobotsTxt(config: {
  siteUrl: string;
  disallow?: string[];
  allow?: string[];
}): string {
  const { siteUrl, disallow = [], allow = [] } = config;

  return [
    'User-agent: *',
    ...allow.map((path) => `Allow: ${path}`),
    ...disallow.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}
