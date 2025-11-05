import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { I18nConfig } from '../config/index.js';
import type { DocFile } from './navigation-builder.js';
import { getLocalizedPath, getLocalizedFilePath } from './i18n.js';

/**
 * Load all markdown files for a specific locale
 *
 * Scans the docs directory and loads all .md files from the locale subdirectory.
 * Each file gets an href that includes the locale prefix (except for default locale).
 *
 * Example structure:
 * ```
 * docs/
 *   en/
 *     guide.md        → /docs/guide
 *     api/intro.md    → /docs/api/intro
 *   es/
 *     guide.md        → /es/docs/guide
 *     api/intro.md    → /es/docs/api/intro
 * ```
 *
 * @param options - Loading options
 * @returns Array of DocFile objects
 *
 * @public
 */
export async function loadLocalizedDocs(options: {
	docsRoot: string;
	locale: string;
	basePath?: string;
	i18nConfig?: I18nConfig;
}): Promise<DocFile[]> {
	const { docsRoot, locale, basePath = '/docs', i18nConfig } = options;

	// Determine the directory to scan
	const localeDir = i18nConfig
		? join(docsRoot, locale)
		: docsRoot;

	if (!existsSync(localeDir)) {
		return [];
	}

	// Recursively find all .md files
	const mdFiles = await findMarkdownFiles(localeDir);

	// Load content and build DocFile objects
	const docFiles: DocFile[] = await Promise.all(
		mdFiles.map(async (filePath) => {
			const content = await readFile(join(localeDir, filePath), 'utf-8');

			// Convert file path to URL slug (remove .md extension)
			const slug = filePath.replace(/\.md$/, '');

			// Build href with locale prefix if needed
			const href = i18nConfig
				? getLocalizedPath(`${basePath}/${slug}`, locale, i18nConfig)
				: `${basePath}/${slug}`;

			return {
				path: filePath,
				content,
				href
			};
		})
	);

	return docFiles;
}

/**
 * Recursively find all markdown files in a directory
 *
 * Module-private helper - not exported
 */
async function findMarkdownFiles(dir: string, baseDir: string = dir): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			// Recursively scan subdirectories
			const subFiles = await findMarkdownFiles(fullPath, baseDir);
			files.push(...subFiles);
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			// Add relative path from baseDir
			const relativePath = fullPath.replace(baseDir + '/', '');
			files.push(relativePath);
		}
	}

	return files;
}

/**
 * Load docs for all available locales
 *
 * Returns a map of locale code to DocFile array.
 * Useful for pre-generating navigation for all locales.
 *
 * @param options - Loading options
 * @returns Map of locale to docs
 *
 * @public
 */
export async function loadAllLocalizedDocs(options: {
	docsRoot: string;
	basePath?: string;
	i18nConfig: I18nConfig;
}): Promise<Map<string, DocFile[]>> {
	const { docsRoot, basePath, i18nConfig } = options;
	const localeDocsMap = new Map<string, DocFile[]>();

	await Promise.all(
		i18nConfig.locales.map(async (locale) => {
			const docs = await loadLocalizedDocs({
				docsRoot,
				locale: locale.code,
				basePath,
				i18nConfig
			});
			localeDocsMap.set(locale.code, docs);
		})
	);

	return localeDocsMap;
}
