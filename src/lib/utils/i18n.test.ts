import { describe, it, expect } from 'vitest';
import {
	detectLocaleFromPath,
	isRTL,
	getTextDirection,
	getLocalizedPath,
	stripLocaleFromPath,
	getLocalizedFilePath,
	getFallbackChain,
	getLocaleConfig,
	isI18nEnabled
} from './i18n.js';
import type { I18nConfig } from '../config/index.js';

const mockI18nConfig: I18nConfig = {
	defaultLocale: 'en',
	locales: [
		{ code: 'en', label: 'English' },
		{ code: 'es', label: 'Español' },
		{ code: 'zh', label: '中文' },
		{ code: 'ar', label: 'العربية' }
	]
};

describe('i18n utilities', () => {
	describe('detectLocaleFromPath', () => {
		it('should detect default locale from root path', () => {
			expect(detectLocaleFromPath('/docs/guide', mockI18nConfig)).toBe('en');
		});

		it('should detect Spanish locale from path', () => {
			expect(detectLocaleFromPath('/es/docs/guide', mockI18nConfig)).toBe('es');
		});

		it('should detect Chinese locale from path', () => {
			expect(detectLocaleFromPath('/zh/docs/guide', mockI18nConfig)).toBe('zh');
		});

		it('should return default locale for invalid locale code', () => {
			expect(detectLocaleFromPath('/invalid/docs/guide', mockI18nConfig)).toBe('en');
		});

		it('should return "en" when no i18n config provided', () => {
			expect(detectLocaleFromPath('/docs/guide', undefined)).toBe('en');
		});
	});

	describe('isRTL', () => {
		it('should detect Arabic as RTL', () => {
			expect(isRTL('ar')).toBe(true);
		});

		it('should detect Hebrew as RTL', () => {
			expect(isRTL('he')).toBe(true);
		});

		it('should detect Farsi as RTL', () => {
			expect(isRTL('fa')).toBe(true);
		});

		it('should detect Urdu as RTL', () => {
			expect(isRTL('ur')).toBe(true);
		});

		it('should detect English as LTR', () => {
			expect(isRTL('en')).toBe(false);
		});

		it('should detect Spanish as LTR', () => {
			expect(isRTL('es')).toBe(false);
		});

		it('should handle locale codes with regions (ar-SA)', () => {
			expect(isRTL('ar-SA')).toBe(true);
		});
	});

	describe('getTextDirection', () => {
		it('should return "rtl" for Arabic string code', () => {
			expect(getTextDirection('ar')).toBe('rtl');
		});

		it('should return "ltr" for English string code', () => {
			expect(getTextDirection('en')).toBe('ltr');
		});

		it('should return "rtl" for Arabic locale config', () => {
			expect(getTextDirection({ code: 'ar', label: 'العربية' })).toBe('rtl');
		});

		it('should respect explicit dir in locale config', () => {
			expect(getTextDirection({ code: 'en', label: 'English', dir: 'rtl' })).toBe('rtl');
		});
	});

	describe('getLocalizedPath', () => {
		it('should not add prefix for default locale', () => {
			expect(getLocalizedPath('/docs/guide', 'en', mockI18nConfig)).toBe('/docs/guide');
		});

		it('should add prefix for Spanish locale', () => {
			expect(getLocalizedPath('/docs/guide', 'es', mockI18nConfig)).toBe('/es/docs/guide');
		});

		it('should add prefix for Chinese locale', () => {
			expect(getLocalizedPath('/docs/guide', 'zh', mockI18nConfig)).toBe('/zh/docs/guide');
		});

		it('should return original path when no i18n config', () => {
			expect(getLocalizedPath('/docs/guide', 'es', undefined)).toBe('/docs/guide');
		});
	});

	describe('stripLocaleFromPath', () => {
		it('should strip Spanish locale prefix', () => {
			expect(stripLocaleFromPath('/es/docs/guide', mockI18nConfig)).toBe('/docs/guide');
		});

		it('should strip Chinese locale prefix', () => {
			expect(stripLocaleFromPath('/zh/docs/guide', mockI18nConfig)).toBe('/docs/guide');
		});

		it('should leave path unchanged if no locale prefix', () => {
			expect(stripLocaleFromPath('/docs/guide', mockI18nConfig)).toBe('/docs/guide');
		});

		it('should not strip invalid locale codes', () => {
			expect(stripLocaleFromPath('/invalid/docs/guide', mockI18nConfig)).toBe(
				'/invalid/docs/guide'
			);
		});
	});

	describe('getLocalizedFilePath', () => {
		it('should add locale subdirectory for English', () => {
			expect(getLocalizedFilePath('guide.md', 'en', mockI18nConfig)).toBe('en/guide.md');
		});

		it('should add locale subdirectory for Spanish', () => {
			expect(getLocalizedFilePath('guide.md', 'es', mockI18nConfig)).toBe('es/guide.md');
		});

		it('should handle nested paths', () => {
			expect(getLocalizedFilePath('advanced/tutorial.md', 'zh', mockI18nConfig)).toBe(
				'zh/advanced/tutorial.md'
			);
		});

		it('should return original path when no i18n config', () => {
			expect(getLocalizedFilePath('guide.md', 'es', undefined)).toBe('guide.md');
		});
	});

	describe('getFallbackChain', () => {
		it('should return single locale for default', () => {
			expect(getFallbackChain('en', mockI18nConfig)).toEqual(['en']);
		});

		it('should fallback to default for Spanish', () => {
			expect(getFallbackChain('es', mockI18nConfig)).toEqual(['es', 'en']);
		});

		it('should handle region-specific locales (es-MX)', () => {
			expect(getFallbackChain('es-MX', mockI18nConfig)).toEqual(['es-MX', 'es', 'en']);
		});

		it('should handle region-specific locales (zh-CN)', () => {
			expect(getFallbackChain('zh-CN', mockI18nConfig)).toEqual(['zh-CN', 'zh', 'en']);
		});

		it('should return single locale when no i18n config', () => {
			expect(getFallbackChain('es', undefined)).toEqual(['es']);
		});
	});

	describe('getLocaleConfig', () => {
		it('should find English locale config', () => {
			const config = getLocaleConfig('en', mockI18nConfig);
			expect(config).toEqual({ code: 'en', label: 'English' });
		});

		it('should find Spanish locale config', () => {
			const config = getLocaleConfig('es', mockI18nConfig);
			expect(config).toEqual({ code: 'es', label: 'Español' });
		});

		it('should return undefined for invalid locale', () => {
			const config = getLocaleConfig('invalid', mockI18nConfig);
			expect(config).toBeUndefined();
		});

		it('should return undefined when no i18n config', () => {
			const config = getLocaleConfig('en', undefined);
			expect(config).toBeUndefined();
		});
	});

	describe('isI18nEnabled', () => {
		it('should return true for valid i18n config', () => {
			expect(isI18nEnabled(mockI18nConfig)).toBe(true);
		});

		it('should return false when no config', () => {
			expect(isI18nEnabled(undefined)).toBe(false);
		});

		it('should return false for empty locales', () => {
			expect(isI18nEnabled({ defaultLocale: 'en', locales: [] })).toBe(false);
		});
	});
});
