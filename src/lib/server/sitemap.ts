/**
 * Sitemap Generation Utility
 *
 * Generates sitemap.xml from documentation navigation structure.
 * Supports custom priorities, exclusions, and last modified dates.
 */

import type { DocsSection } from '../utils/navigation.js';

/**
 * Sitemap URL entry
 */
export interface SitemapUrl {
	loc: string;
	lastmod?: string;
	changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority?: number;
}

/**
 * Sitemap configuration
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
export function generateSitemap(
	navigation: DocsSection[],
	config: SitemapConfig
): string {
	const {
		siteUrl,
		defaultPriority = 0.7,
		defaultChangefreq = 'weekly',
		lastModified = new Map()
	} = config;

	// Collect all URLs from navigation
	const urls: SitemapUrl[] = [];

	navigation.forEach((section) => {
		section.links.forEach((link) => {
			urls.push({
				loc: `${siteUrl}${link.href}`,
				lastmod: lastModified.get(link.href),
				changefreq: defaultChangefreq,
				priority: defaultPriority
			});
		});
	});

	// Generate XML
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => generateUrlEntry(url)).join('\n')}
</urlset>`;
}

/**
 * Generate a single URL entry for sitemap
 */
function generateUrlEntry(url: SitemapUrl): string {
	const parts = [`  <url>`, `    <loc>${escapeXml(url.loc)}</loc>`];

	if (url.lastmod) {
		parts.push(`    <lastmod>${url.lastmod}</lastmod>`);
	}

	if (url.changefreq) {
		parts.push(`    <changefreq>${url.changefreq}</changefreq>`);
	}

	if (url.priority !== undefined) {
		parts.push(`    <priority>${url.priority.toFixed(1)}</priority>`);
	}

	parts.push(`  </url>`);

	return parts.join('\n');
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
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

	const lines = [
		'User-agent: *',
		...allow.map((path) => `Allow: ${path}`),
		...disallow.map((path) => `Disallow: ${path}`),
		'',
		`Sitemap: ${siteUrl}/sitemap.xml`
	];

	return lines.join('\n');
}
