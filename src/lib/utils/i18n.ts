import type { I18nConfig, LocaleConfig } from '../config/index.js';

/**
 * Right-to-left (RTL) language codes
 * These locales automatically get dir="rtl" applied
 */
const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

/**
 * Detect locale from URL pathname
 *
 * Examples:
 * - `/docs/guide` → 'en' (default)
 * - `/es/docs/guide` → 'es'
 * - `/zh/docs/guide` → 'zh'
 *
 * @param pathname - URL pathname (e.g., '/es/docs/guide')
 * @param i18nConfig - i18n configuration
 * @returns Detected locale code
 *
 * @public
 */
export function detectLocaleFromPath(
	pathname: string,
	i18nConfig?: I18nConfig
): string {
	if (!i18nConfig) {
		return 'en'; // No i18n config, use default
	}

	// Extract first segment from pathname
	const segments = pathname.split('/').filter(Boolean);
	const firstSegment = segments[0];

	// Check if first segment matches a configured locale
	const matchedLocale = i18nConfig.locales.find((locale) => locale.code === firstSegment);

	if (matchedLocale) {
		return matchedLocale.code;
	}

	// Default locale (no prefix in URL)
	return i18nConfig.defaultLocale;
}

/**
 * Check if a locale uses right-to-left text direction
 *
 * @param localeCode - Locale code (e.g., 'ar', 'he', 'en')
 * @returns True if RTL locale
 *
 * @public
 */
export function isRTL(localeCode: string): boolean {
	// Extract base language code (e.g., 'ar' from 'ar-SA')
	const baseCode = localeCode.split('-')[0].toLowerCase();
	return RTL_LOCALES.includes(baseCode);
}

/**
 * Get text direction for a locale
 *
 * @param locale - Locale configuration or code
 * @returns 'rtl' or 'ltr'
 *
 * @public
 */
export function getTextDirection(locale: LocaleConfig | string): 'rtl' | 'ltr' {
	if (typeof locale === 'string') {
		return isRTL(locale) ? 'rtl' : 'ltr';
	}

	// Use explicit dir if provided, otherwise auto-detect
	return locale.dir || (isRTL(locale.code) ? 'rtl' : 'ltr');
}

/**
 * Build localized path with locale prefix
 *
 * Examples:
 * - `/docs/guide` + 'es' → `/es/docs/guide`
 * - `/docs/guide` + 'en' (default) → `/docs/guide`
 *
 * @param path - Base path without locale
 * @param locale - Target locale code
 * @param i18nConfig - i18n configuration
 * @returns Localized path
 *
 * @public
 */
export function getLocalizedPath(
	path: string,
	locale: string,
	i18nConfig?: I18nConfig
): string {
	if (!i18nConfig) {
		return path; // No i18n, return original path
	}

	// Default locale has no prefix
	if (locale === i18nConfig.defaultLocale) {
		return path;
	}

	// Add locale prefix
	return `/${locale}${path}`;
}

/**
 * Strip locale prefix from path
 *
 * Examples:
 * - `/es/docs/guide` → `/docs/guide`
 * - `/docs/guide` → `/docs/guide`
 *
 * @param pathname - Full pathname with potential locale prefix
 * @param i18nConfig - i18n configuration
 * @returns Path without locale prefix
 *
 * @public
 */
export function stripLocaleFromPath(pathname: string, i18nConfig?: I18nConfig): string {
	if (!i18nConfig) {
		return pathname;
	}

	const segments = pathname.split('/').filter(Boolean);
	const firstSegment = segments[0];

	// Check if first segment is a locale code
	const isLocalePrefix = i18nConfig.locales.some((locale) => locale.code === firstSegment);

	if (isLocalePrefix) {
		// Remove locale prefix
		segments.shift();
		return '/' + segments.join('/');
	}

	return pathname;
}

/**
 * Get locale-aware file path for content loading
 *
 * Examples:
 * - `guide.md` + 'es' → `es/guide.md`
 * - `guide.md` + 'en' (default) → `en/guide.md`
 *
 * @param filePath - Base file path
 * @param locale - Locale code
 * @param i18nConfig - i18n configuration
 * @returns Locale-specific file path
 *
 * @public
 */
export function getLocalizedFilePath(
	filePath: string,
	locale: string,
	i18nConfig?: I18nConfig
): string {
	if (!i18nConfig) {
		return filePath;
	}

	// Always use locale subdirectory (even for default locale)
	return `${locale}/${filePath}`;
}

/**
 * Get fallback locale chain
 *
 * Examples:
 * - 'es-MX' → ['es-MX', 'es', 'en']
 * - 'es' → ['es', 'en']
 * - 'en' → ['en']
 *
 * @param locale - Current locale
 * @param i18nConfig - i18n configuration
 * @returns Array of locale codes to try (in order)
 *
 * @public
 */
export function getFallbackChain(locale: string, i18nConfig?: I18nConfig): string[] {
	if (!i18nConfig) {
		return [locale];
	}

	const chain: string[] = [locale];

	// Add base language if this is a region-specific locale (e.g., es-MX → es)
	if (locale.includes('-')) {
		const baseLocale = locale.split('-')[0];
		if (baseLocale !== locale && !chain.includes(baseLocale)) {
			chain.push(baseLocale);
		}
	}

	// Add default locale as final fallback
	if (i18nConfig.defaultLocale !== locale && !chain.includes(i18nConfig.defaultLocale)) {
		chain.push(i18nConfig.defaultLocale);
	}

	return chain;
}

/**
 * Get locale configuration by code
 *
 * @param localeCode - Locale code to find
 * @param i18nConfig - i18n configuration
 * @returns Locale configuration or undefined
 *
 * @public
 */
export function getLocaleConfig(
	localeCode: string,
	i18nConfig?: I18nConfig
): LocaleConfig | undefined {
	if (!i18nConfig) {
		return undefined;
	}

	return i18nConfig.locales.find((locale) => locale.code === localeCode);
}

/**
 * Check if i18n is enabled in configuration
 *
 * @param i18nConfig - i18n configuration
 * @returns True if i18n is enabled
 *
 * @public
 */
export function isI18nEnabled(i18nConfig?: I18nConfig): boolean {
	return !!i18nConfig && i18nConfig.locales.length > 0;
}
