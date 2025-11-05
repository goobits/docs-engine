import { describe, it, expect } from 'vitest';
import { generateSitemap, generateRobotsTxt, type SitemapConfig } from './sitemap';
import type { DocsSection } from '../utils/navigation';

const mockNavigation: DocsSection[] = [
	{
		title: 'Getting Started',
		description: 'Get started',
		icon: () => null,
		links: [
			{ title: 'Installation', href: '/docs/installation', description: 'Install' },
			{ title: 'Quick Start', href: '/docs/quick-start', description: 'Quick start' }
		]
	},
	{
		title: 'Features',
		description: 'Features',
		icon: () => null,
		links: [{ title: 'Search', href: '/docs/features/search', description: 'Search' }]
	}
];

describe('sitemap utilities', () => {
	describe('generateSitemap', () => {
		const config: SitemapConfig = {
			siteUrl: 'https://docs.example.com',
			defaultPriority: 0.8
		};

		it('should generate valid XML sitemap', () => {
			const sitemap = generateSitemap(mockNavigation, config);
			expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(sitemap).toContain('<urlset');
			expect(sitemap).toContain('</urlset>');
		});

		it('should include all navigation links', () => {
			const sitemap = generateSitemap(mockNavigation, config);
			expect(sitemap).toContain('https://docs.example.com/docs/installation');
			expect(sitemap).toContain('https://docs.example.com/docs/quick-start');
			expect(sitemap).toContain('https://docs.example.com/docs/features/search');
		});

		it('should include loc tags for each URL', () => {
			const sitemap = generateSitemap(mockNavigation, config);
			const locCount = (sitemap.match(/<loc>/g) || []).length;
			expect(locCount).toBe(3); // 3 links in mockNavigation
		});

		it('should include priority when specified', () => {
			const sitemap = generateSitemap(mockNavigation, config);
			expect(sitemap).toContain('<priority>0.8</priority>');
		});

		it('should include changefreq when specified', () => {
			const sitemapConfig: SitemapConfig = {
				...config,
				defaultChangefreq: 'weekly'
			};
			const sitemap = generateSitemap(mockNavigation, sitemapConfig);
			expect(sitemap).toContain('<changefreq>weekly</changefreq>');
		});

		it('should include lastmod when provided', () => {
			const lastModified = new Map([
				['/docs/installation', '2024-01-15T00:00:00.000Z']
			]);
			const sitemapConfig: SitemapConfig = {
				...config,
				lastModified
			};
			const sitemap = generateSitemap(mockNavigation, sitemapConfig);
			expect(sitemap).toContain('<lastmod>2024-01-15T00:00:00.000Z</lastmod>');
		});

		it('should escape XML special characters', () => {
			const navWithSpecialChars: DocsSection[] = [
				{
					title: 'Test',
					description: 'Test',
					icon: () => null,
					links: [
						{
							title: 'Test & Debug',
							href: '/docs/test&debug',
							description: 'Test'
						}
					]
				}
			];
			const sitemap = generateSitemap(navWithSpecialChars, config);
			expect(sitemap).toContain('&amp;');
			expect(sitemap).not.toContain('/docs/test&debug'); // Should be escaped
		});
	});

	describe('generateRobotsTxt', () => {
		it('should generate basic robots.txt', () => {
			const robots = generateRobotsTxt({
				siteUrl: 'https://docs.example.com'
			});
			expect(robots).toContain('User-agent: *');
			expect(robots).toContain('Sitemap: https://docs.example.com/sitemap.xml');
		});

		it('should include disallow rules', () => {
			const robots = generateRobotsTxt({
				siteUrl: 'https://docs.example.com',
				disallow: ['/api/*', '/internal/*']
			});
			expect(robots).toContain('Disallow: /api/*');
			expect(robots).toContain('Disallow: /internal/*');
		});

		it('should include allow rules', () => {
			const robots = generateRobotsTxt({
				siteUrl: 'https://docs.example.com',
				allow: ['/docs/*']
			});
			expect(robots).toContain('Allow: /docs/*');
		});

		it('should have allow rules before disallow rules', () => {
			const robots = generateRobotsTxt({
				siteUrl: 'https://docs.example.com',
				allow: ['/docs/*'],
				disallow: ['/api/*']
			});
			const allowIndex = robots.indexOf('Allow:');
			const disallowIndex = robots.indexOf('Disallow:');
			expect(allowIndex).toBeLessThan(disallowIndex);
		});

		it('should end with sitemap URL', () => {
			const robots = generateRobotsTxt({
				siteUrl: 'https://docs.example.com'
			});
			expect(robots.trim().endsWith('Sitemap: https://docs.example.com/sitemap.xml')).toBe(
				true
			);
		});
	});
});
