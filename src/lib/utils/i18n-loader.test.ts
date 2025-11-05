import { describe, it, expect, beforeAll } from 'vitest';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
	loadLocalizedContent,
	localizedContentExists,
	getAvailableLocalesForContent
} from './i18n-loader.js';
import type { I18nConfig } from '../config/index.js';

const testDocsRoot = join(tmpdir(), 'i18n-loader-test');

const mockI18nConfig: I18nConfig = {
	defaultLocale: 'en',
	locales: [
		{ code: 'en', label: 'English' },
		{ code: 'es', label: 'Español' },
		{ code: 'zh', label: '中文' }
	]
};

describe('i18n content loader', () => {
	beforeAll(async () => {
		// Setup test docs structure
		await mkdir(join(testDocsRoot, 'en'), { recursive: true });
		await mkdir(join(testDocsRoot, 'es'), { recursive: true });
		await mkdir(join(testDocsRoot, 'zh'), { recursive: true });

		// Create test files
		await writeFile(
			join(testDocsRoot, 'en', 'guide.md'),
			'---\ntitle: Guide\n---\n# English Guide'
		);
		await writeFile(
			join(testDocsRoot, 'es', 'guide.md'),
			'---\ntitle: Guía\n---\n# Guía en Español'
		);
		await writeFile(
			join(testDocsRoot, 'en', 'tutorial.md'),
			'---\ntitle: Tutorial\n---\n# English Tutorial Only'
		);
		await writeFile(join(testDocsRoot, 'zh', 'advanced.md'), '# 高级指南');
	});

	describe('loadLocalizedContent', () => {
		it('should load content in requested locale', async () => {
			const result = await loadLocalizedContent({
				docsRoot: testDocsRoot,
				slug: 'guide',
				locale: 'es',
				i18nConfig: mockI18nConfig
			});

			expect(result).not.toBeNull();
			expect(result?.locale).toBe('es');
			expect(result?.content).toContain('Guía en Español');
			expect(result?.isFallback).toBe(false);
		});

		it('should fallback to English when Spanish not available', async () => {
			const result = await loadLocalizedContent({
				docsRoot: testDocsRoot,
				slug: 'tutorial',
				locale: 'es',
				i18nConfig: mockI18nConfig
			});

			expect(result).not.toBeNull();
			expect(result?.locale).toBe('en');
			expect(result?.content).toContain('English Tutorial Only');
			expect(result?.isFallback).toBe(true);
		});

		it('should load English content directly', async () => {
			const result = await loadLocalizedContent({
				docsRoot: testDocsRoot,
				slug: 'guide',
				locale: 'en',
				i18nConfig: mockI18nConfig
			});

			expect(result).not.toBeNull();
			expect(result?.locale).toBe('en');
			expect(result?.content).toContain('English Guide');
			expect(result?.isFallback).toBe(false);
		});

		it('should return null for non-existent content', async () => {
			const result = await loadLocalizedContent({
				docsRoot: testDocsRoot,
				slug: 'does-not-exist',
				locale: 'es',
				i18nConfig: mockI18nConfig
			});

			expect(result).toBeNull();
		});

		it('should handle region-specific locale fallback (es-MX → es → en)', async () => {
			const result = await loadLocalizedContent({
				docsRoot: testDocsRoot,
				slug: 'guide',
				locale: 'es-MX',
				i18nConfig: mockI18nConfig
			});

			expect(result).not.toBeNull();
			expect(result?.locale).toBe('es'); // Falls back to 'es'
			expect(result?.content).toContain('Guía en Español');
			expect(result?.isFallback).toBe(true); // Not es-MX, so it's a fallback
		});

		it('should work without i18n config', async () => {
			// Create a file at root level for this test
			await writeFile(join(testDocsRoot, 'no-i18n.md'), '# No i18n content');

			const result = await loadLocalizedContent({
				docsRoot: testDocsRoot,
				slug: 'no-i18n',
				locale: 'en',
				i18nConfig: undefined
			});

			expect(result).not.toBeNull();
			expect(result?.locale).toBe('en');
			expect(result?.content).toContain('No i18n content');
		});
	});

	describe('localizedContentExists', () => {
		it('should return true for existing English content', () => {
			const exists = localizedContentExists({
				docsRoot: testDocsRoot,
				slug: 'guide',
				locale: 'en',
				i18nConfig: mockI18nConfig
			});

			expect(exists).toBe(true);
		});

		it('should return true for existing Spanish content', () => {
			const exists = localizedContentExists({
				docsRoot: testDocsRoot,
				slug: 'guide',
				locale: 'es',
				i18nConfig: mockI18nConfig
			});

			expect(exists).toBe(true);
		});

		it('should return true when fallback exists', () => {
			const exists = localizedContentExists({
				docsRoot: testDocsRoot,
				slug: 'tutorial',
				locale: 'es',
				i18nConfig: mockI18nConfig
			});

			expect(exists).toBe(true); // Falls back to English
		});

		it('should return false for non-existent content', () => {
			const exists = localizedContentExists({
				docsRoot: testDocsRoot,
				slug: 'does-not-exist',
				locale: 'es',
				i18nConfig: mockI18nConfig
			});

			expect(exists).toBe(false);
		});
	});

	describe('getAvailableLocalesForContent', () => {
		it('should return locales where guide exists', () => {
			const locales = getAvailableLocalesForContent({
				docsRoot: testDocsRoot,
				slug: 'guide',
				i18nConfig: mockI18nConfig
			});

			expect(locales).toContain('en');
			expect(locales).toContain('es');
			expect(locales).not.toContain('zh');
		});

		it('should return only English for tutorial', () => {
			const locales = getAvailableLocalesForContent({
				docsRoot: testDocsRoot,
				slug: 'tutorial',
				i18nConfig: mockI18nConfig
			});

			expect(locales).toEqual(['en']);
		});

		it('should return only Chinese for advanced guide', () => {
			const locales = getAvailableLocalesForContent({
				docsRoot: testDocsRoot,
				slug: 'advanced',
				i18nConfig: mockI18nConfig
			});

			expect(locales).toEqual(['zh']);
		});

		it('should return empty array for non-existent content', () => {
			const locales = getAvailableLocalesForContent({
				docsRoot: testDocsRoot,
				slug: 'does-not-exist',
				i18nConfig: mockI18nConfig
			});

			expect(locales).toEqual([]);
		});
	});
});
