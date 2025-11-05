import type { I18nConfig } from '../config/index.js';
import { getLocalizedPath } from './i18n.js';

/**
 * Hreflang link for SEO
 *
 * @public
 */
export interface HreflangLink {
	hreflang: string;
	href: string;
}

/**
 * Generate hreflang tags for multi-language SEO
 *
 * Creates link tags for all available locales plus x-default.
 * Follows Google's recommendations for international SEO.
 *
 * Example output:
 * ```html
 * <link rel="alternate" hreflang="en" href="https://example.com/docs/guide" />
 * <link rel="alternate" hreflang="es" href="https://example.com/es/docs/guide" />
 * <link rel="alternate" hreflang="x-default" href="https://example.com/docs/guide" />
 * ```
 *
 * @param options - Generation options
 * @returns Array of hreflang link objects
 *
 * @public
 */
export function generateHreflangLinks(options: {
	pathname: string;
	siteUrl: string;
	i18nConfig: I18nConfig;
	availableLocales?: string[];
}): HreflangLink[] {
	const { pathname, siteUrl, i18nConfig, availableLocales } = options;

	// Filter to available locales if provided
	const locales = availableLocales
		? i18nConfig.locales.filter((locale) => availableLocales.includes(locale.code))
		: i18nConfig.locales;

	const links: HreflangLink[] = [];

	// Add link for each locale
	locales.forEach((locale) => {
		const localizedPath = getLocalizedPath(pathname, locale.code, i18nConfig);
		const fullUrl = `${siteUrl}${localizedPath}`;

		links.push({
			hreflang: locale.code,
			href: fullUrl
		});
	});

	// Add x-default for default locale
	const defaultPath = getLocalizedPath(pathname, i18nConfig.defaultLocale, i18nConfig);
	const defaultUrl = `${siteUrl}${defaultPath}`;

	links.push({
		hreflang: 'x-default',
		href: defaultUrl
	});

	return links;
}

/**
 * Generate HTML <link> tags for hreflang
 *
 * @param links - Hreflang links
 * @returns HTML string with link tags
 *
 * @public
 */
export function hreflangLinksToHtml(links: HreflangLink[]): string {
	return links
		.map(
			(link) =>
				`<link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`
		)
		.join('\n');
}

/**
 * Generate canonical URL for current page
 *
 * @param pathname - Current pathname
 * @param siteUrl - Base site URL
 * @returns Canonical URL
 *
 * @public
 */
export function generateCanonicalUrl(pathname: string, siteUrl: string): string {
	return `${siteUrl}${pathname}`;
}
