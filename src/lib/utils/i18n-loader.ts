import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { I18nConfig } from '../config/index.js';
import { getFallbackChain, getLocalizedFilePath } from './i18n.js';

/**
 * Result of loading localized content
 *
 * @public
 */
export interface LocalizedContent {
	/** File content */
	content: string;
	/** Locale used (may be fallback locale) */
	locale: string;
	/** Path that was successfully loaded */
	filePath: string;
	/** Whether this is a fallback (not the requested locale) */
	isFallback: boolean;
}

/**
 * Load content with locale fallback support
 *
 * Tries to load content in this order:
 * 1. Requested locale (e.g., 'es')
 * 2. Base language if region-specific (e.g., 'es' for 'es-MX')
 * 3. Default locale (e.g., 'en')
 *
 * Example:
 * ```typescript
 * const content = await loadLocalizedContent({
 *   docsRoot: './docs',
 *   slug: 'guide',
 *   locale: 'es-MX',
 *   i18nConfig: { defaultLocale: 'en', locales: [...] }
 * });
 * // Tries: docs/es-MX/guide.md → docs/es/guide.md → docs/en/guide.md
 * ```
 *
 * @param options - Loading options
 * @returns Localized content or null if not found
 *
 * @public
 */
export async function loadLocalizedContent(options: {
	docsRoot: string;
	slug: string;
	locale: string;
	i18nConfig?: I18nConfig;
}): Promise<LocalizedContent | null> {
	const { docsRoot, slug, locale, i18nConfig } = options;

	// If i18n not enabled, just try to load directly
	if (!i18nConfig) {
		const filePath = join(docsRoot, `${slug}.md`);
		if (existsSync(filePath)) {
			const content = await readFile(filePath, 'utf-8');
			return {
				content,
				locale: 'en',
				filePath: `${slug}.md`,
				isFallback: false
			};
		}
		return null;
	}

	// Get fallback chain (e.g., ['es-MX', 'es', 'en'])
	const fallbackChain = getFallbackChain(locale, i18nConfig);

	// Try each locale in fallback chain
	for (let i = 0; i < fallbackChain.length; i++) {
		const currentLocale = fallbackChain[i];
		const localizedFilePath = getLocalizedFilePath(`${slug}.md`, currentLocale, i18nConfig);
		const fullPath = join(docsRoot, localizedFilePath);

		if (existsSync(fullPath)) {
			const content = await readFile(fullPath, 'utf-8');
			return {
				content,
				locale: currentLocale,
				filePath: localizedFilePath,
				isFallback: i > 0 // True if not the first locale in chain
			};
		}
	}

	// Not found in any locale
	return null;
}

/**
 * Check if localized content exists (without loading)
 *
 * @param options - Check options
 * @returns True if content exists in any fallback locale
 *
 * @public
 */
export function localizedContentExists(options: {
	docsRoot: string;
	slug: string;
	locale: string;
	i18nConfig?: I18nConfig;
}): boolean {
	const { docsRoot, slug, locale, i18nConfig } = options;

	if (!i18nConfig) {
		return existsSync(join(docsRoot, `${slug}.md`));
	}

	const fallbackChain = getFallbackChain(locale, i18nConfig);

	return fallbackChain.some((currentLocale) => {
		const localizedFilePath = getLocalizedFilePath(`${slug}.md`, currentLocale, i18nConfig);
		const fullPath = join(docsRoot, localizedFilePath);
		return existsSync(fullPath);
	});
}

/**
 * Get all available locales for a specific slug
 *
 * Returns list of locales where this content exists.
 * Useful for building language switcher links.
 *
 * @param options - Query options
 * @returns Array of locale codes where content exists
 *
 * @public
 */
export function getAvailableLocalesForContent(options: {
	docsRoot: string;
	slug: string;
	i18nConfig?: I18nConfig;
}): string[] {
	const { docsRoot, slug, i18nConfig } = options;

	if (!i18nConfig) {
		return existsSync(join(docsRoot, `${slug}.md`)) ? ['en'] : [];
	}

	return i18nConfig.locales
		.filter((locale) => {
			const localizedFilePath = getLocalizedFilePath(`${slug}.md`, locale.code, i18nConfig);
			const fullPath = join(docsRoot, localizedFilePath);
			return existsSync(fullPath);
		})
		.map((locale) => locale.code);
}
