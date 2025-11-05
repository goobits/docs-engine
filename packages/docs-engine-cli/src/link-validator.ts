import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import type { ExtractedLink } from './link-extractor.js';
import pLimit from 'p-limit';

/**
 * Link validation result
 *
 * @public
 */
export interface ValidationResult {
	/** The link that was validated */
	link: ExtractedLink;
	/** Whether the link is valid */
	isValid: boolean;
	/** Error message if invalid */
	error?: string;
	/** HTTP status code (for external links) */
	statusCode?: number;
	/** Redirect URL (if redirected) */
	redirectUrl?: string;
}

/**
 * Configuration options for link validation
 *
 * @public
 */
export interface ValidationOptions {
	/** Base directory for resolving relative paths */
	baseDir: string;
	/** Validate external links (requires HTTP requests) */
	checkExternal?: boolean;
	/** Timeout for external link requests (ms) */
	timeout?: number;
	/** Maximum concurrent external requests */
	concurrency?: number;
	/** Domains to skip validation */
	skipDomains?: string[];
	/** File extensions to treat as valid */
	validExtensions?: string[];
}

/**
 * Resolve a relative link to an absolute file path
 *
 * Handles:
 * - Relative paths: `./file.md`, `../file.md`
 * - Absolute paths: `/docs/file.md`
 * - Removes `.md` extension for route matching
 * - Supports anchor links: `file.md#section`
 *
 * @param link - Link to resolve
 * @param sourceFile - Source file containing the link
 * @param baseDir - Base directory for absolute paths
 * @returns Resolved file path (without anchor)
 *
 * @example
 * ```typescript
 * resolveLinkPath(
 *   './guide.md#intro',
 *   '/docs/getting-started.md',
 *   '/project'
 * );
 * // Returns: '/project/docs/guide.md'
 * ```
 *
 * @internal
 */
export function resolveLinkPath(link: string, sourceFile: string, baseDir: string): string {
	// Remove anchor
	const [pathPart] = link.split('#');

	// Handle absolute paths
	if (pathPart.startsWith('/')) {
		return resolve(baseDir, pathPart.slice(1));
	}

	// Handle relative paths
	const sourceDir = dirname(sourceFile);
	return resolve(sourceDir, pathPart);
}

/**
 * Extract anchor from URL
 *
 * @param url - URL with potential anchor
 * @returns Anchor name (without #) or undefined
 *
 * @example
 * ```typescript
 * extractAnchor('guide.md#installation'); // 'installation'
 * extractAnchor('#intro'); // 'intro'
 * extractAnchor('guide.md'); // undefined
 * ```
 *
 * @internal
 */
export function extractAnchor(url: string): string | undefined {
	const parts = url.split('#');
	return parts.length > 1 ? parts[1] : undefined;
}

/**
 * Check if an anchor exists in a markdown file
 *
 * Checks for:
 * - Headers: `## Section Name` → `#section-name`
 * - HTML anchors: `<a name="anchor">` or `<a id="anchor">`
 *
 * @param filePath - Path to markdown file
 * @param anchor - Anchor to find (without #)
 * @returns True if anchor exists
 *
 * @example
 * ```typescript
 * anchorExistsInFile('./docs/guide.md', 'installation');
 * // Returns: true if file has ## Installation heading
 * ```
 *
 * @internal
 */
export function anchorExistsInFile(filePath: string, anchor: string): boolean {
	try {
		const content = readFileSync(filePath, 'utf-8');

		// Convert anchor to expected format (lowercase, spaces to hyphens)
		const normalizedAnchor = anchor.toLowerCase().replace(/\s+/g, '-');

		// Check for markdown headers
		// Match: ## Header, ### Header, etc.
		const headerRegex = /^#+\s+(.+)$/gm;
		let match;

		while ((match = headerRegex.exec(content)) !== null) {
			const headerText = match[1];
			const headerId = headerText
				.toLowerCase()
				.replace(/[^\w\s-]/g, '') // Remove special chars
				.replace(/\s+/g, '-'); // Spaces to hyphens

			if (headerId === normalizedAnchor) {
				return true;
			}
		}

		// Check for HTML anchors
		const htmlAnchorRegex = /<a\s+(?:name|id)=["']([^"']+)["']/gi;
		while ((match = htmlAnchorRegex.exec(content)) !== null) {
			if (match[1] === anchor) {
				return true;
			}
		}

		return false;
	} catch {
		return false;
	}
}

/**
 * Validate an internal link
 *
 * Checks:
 * - File exists
 * - Anchor exists (if present)
 * - Handles .md extension conversion
 *
 * @param link - Link to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateInternalLink(link, { baseDir: '/project' });
 * if (!result.isValid) {
 *   console.error(`Broken link: ${result.error}`);
 * }
 * ```
 *
 * @public
 */
export function validateInternalLink(
	link: ExtractedLink,
	options: ValidationOptions
): ValidationResult {
	const { baseDir, validExtensions = ['.md', '.mdx'] } = options;

	try {
		// Resolve the link path
		let targetPath = resolveLinkPath(link.url, link.file, baseDir);

		// Check if file exists as-is
		let fileExists = existsSync(targetPath);

		// If not, try adding valid extensions
		if (!fileExists) {
			for (const ext of validExtensions) {
				const pathWithExt = targetPath + ext;
				if (existsSync(pathWithExt)) {
					targetPath = pathWithExt;
					fileExists = true;
					break;
				}
			}
		}

		// Check if it's a directory with index file
		if (!fileExists && existsSync(targetPath) && statSync(targetPath).isDirectory()) {
			for (const ext of validExtensions) {
				const indexPath = join(targetPath, `index${ext}`);
				if (existsSync(indexPath)) {
					targetPath = indexPath;
					fileExists = true;
					break;
				}
			}
		}

		if (!fileExists) {
			return {
				link,
				isValid: false,
				error: `File not found: ${targetPath}`
			};
		}

		// Check anchor if present
		const anchor = extractAnchor(link.url);
		if (anchor) {
			const anchorExists = anchorExistsInFile(targetPath, anchor);
			if (!anchorExists) {
				return {
					link,
					isValid: false,
					error: `Anchor #${anchor} not found in ${targetPath}`
				};
			}
		}

		return {
			link,
			isValid: true
		};
	} catch (error) {
		return {
			link,
			isValid: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Validate an external link with HTTP request
 *
 * @param link - Link to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = await validateExternalLink(link, { timeout: 5000 });
 * console.log(`Status: ${result.statusCode}`);
 * ```
 *
 * @public
 */
export async function validateExternalLink(
	link: ExtractedLink,
	options: ValidationOptions
): Promise<ValidationResult> {
	const { timeout = 5000, skipDomains = [] } = options;

	try {
		// Check if domain should be skipped
		const url = new URL(link.url);
		if (skipDomains.some((domain) => url.hostname.includes(domain))) {
			return {
				link,
				isValid: true,
				statusCode: 0 // Skipped
			};
		}

		// Make HEAD request with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(link.url, {
			method: 'HEAD',
			signal: controller.signal,
			redirect: 'follow'
		});

		clearTimeout(timeoutId);

		const isValid = response.ok; // 200-299

		return {
			link,
			isValid,
			statusCode: response.status,
			redirectUrl: response.redirected ? response.url : undefined,
			error: isValid ? undefined : `HTTP ${response.status} ${response.statusText}`
		};
	} catch (error) {
		return {
			link,
			isValid: false,
			statusCode: 0,
			error: error instanceof Error ? error.message : 'Request failed'
		};
	}
}

/**
 * Validate multiple links with concurrency control
 *
 * @param links - Links to validate
 * @param options - Validation options
 * @returns Array of validation results
 *
 * @example
 * ```typescript
 * const results = await validateLinks(allLinks, {
 *   baseDir: '/project',
 *   checkExternal: true,
 *   concurrency: 10
 * });
 *
 * const broken = results.filter(r => !r.isValid);
 * console.log(`Found ${broken.length} broken links`);
 * ```
 *
 * @public
 */
export async function validateLinks(
	links: ExtractedLink[],
	options: ValidationOptions
): Promise<ValidationResult[]> {
	const { concurrency = 10, checkExternal = false } = options;
	const results: ValidationResult[] = [];

	// Separate internal and external links
	const internalLinks = links.filter((l) => !l.isExternal);
	const externalLinks = links.filter((l) => l.isExternal);

	// Validate internal links (synchronous)
	for (const link of internalLinks) {
		results.push(validateInternalLink(link, options));
	}

	// Validate external links (asynchronous with concurrency)
	if (checkExternal && externalLinks.length > 0) {
		const limit = pLimit(concurrency);
		const externalResults = await Promise.all(
			externalLinks.map((link) => limit(() => validateExternalLink(link, options)))
		);
		results.push(...externalResults);
	}

	return results;
}
