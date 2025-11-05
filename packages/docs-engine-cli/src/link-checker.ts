/**
 * Link Checker Utility
 *
 * Validates internal and external links in markdown documentation.
 * Detects broken links, missing anchors, and invalid URLs.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Link, Image } from 'mdast';

/**
 * Link found in documentation
 */
export interface DocumentLink {
	url: string;
	text: string;
	filePath: string;
	lineNumber?: number;
	type: 'link' | 'image';
}

/**
 * Link check result
 */
export interface LinkCheckResult {
	link: DocumentLink;
	status: 'valid' | 'broken' | 'warning';
	error?: string;
	statusCode?: number;
}

/**
 * Link checker configuration
 */
export interface LinkCheckerConfig {
	/** Directory containing markdown files */
	docsDir: string;
	/** Check external links (default: false) */
	checkExternal?: boolean;
	/** External link timeout in ms (default: 5000) */
	timeout?: number;
	/** Max concurrent external requests (default: 10) */
	concurrency?: number;
	/** Domains to skip checking */
	skipDomains?: string[];
	/** Patterns to ignore (glob patterns) */
	ignorePatterns?: string[];
	/** Base URL for resolving absolute paths */
	baseUrl?: string;
}

/**
 * Extract all links from markdown files
 *
 * @public
 */
export async function extractLinks(config: LinkCheckerConfig): Promise<DocumentLink[]> {
	const { docsDir, ignorePatterns = [] } = config;

	// Find all markdown files
	const files = await glob('**/*.md', {
		cwd: docsDir,
		ignore: ignorePatterns,
		absolute: true
	});

	const allLinks: DocumentLink[] = [];

	for (const filePath of files) {
		const content = await fs.readFile(filePath, 'utf-8');
		const links = await extractLinksFromFile(filePath, content);
		allLinks.push(...links);
	}

	return allLinks;
}

/**
 * Extract links from a single markdown file
 */
async function extractLinksFromFile(
	filePath: string,
	content: string
): Promise<DocumentLink[]> {
	const links: DocumentLink[] = [];

	const tree = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.parse(content);

	visit(tree, ['link', 'image'], (node: Link | Image) => {
		links.push({
			url: node.url,
			text: 'children' in node && node.children?.[0]
				? (node.children[0] as any).value
				: node.url,
			filePath,
			lineNumber: node.position?.start.line,
			type: node.type === 'image' ? 'image' : 'link'
		});
	});

	return links;
}

/**
 * Check all links
 *
 * @public
 */
export async function checkLinks(
	links: DocumentLink[],
	config: LinkCheckerConfig
): Promise<LinkCheckResult[]> {
	const results: LinkCheckResult[] = [];

	// Separate internal and external links
	const internalLinks = links.filter(link => isInternalLink(link.url));
	const externalLinks = links.filter(link => !isInternalLink(link.url));

	// Check internal links
	for (const link of internalLinks) {
		results.push(await checkInternalLink(link, config));
	}

	// Check external links if enabled
	if (config.checkExternal) {
		const externalResults = await checkExternalLinks(externalLinks, config);
		results.push(...externalResults);
	}

	return results;
}

/**
 * Check if a URL is internal
 */
function isInternalLink(url: string): boolean {
	// Relative paths, absolute paths, and anchors are internal
	return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//');
}

/**
 * Check internal link
 */
async function checkInternalLink(
	link: DocumentLink,
	config: LinkCheckerConfig
): Promise<LinkCheckResult> {
	const { url, filePath } = link;
	const { docsDir } = config;

	// Handle anchor-only links
	if (url.startsWith('#')) {
		// Check if anchor exists in the same file
		const anchors = await extractAnchorsFromFile(filePath);
		const anchor = url.slice(1);

		if (anchors.includes(anchor)) {
			return { link, status: 'valid' };
		}
		return {
			link,
			status: 'broken',
			error: `Anchor #${anchor} not found in file`
		};
	}

	// Split URL and anchor
	const [urlPath, anchor] = url.split('#');

	// Resolve relative path
	const fileDir = path.dirname(filePath);
	let targetPath: string;

	if (urlPath.startsWith('/')) {
		// Absolute path from docs root
		targetPath = path.join(docsDir, urlPath);
	} else {
		// Relative path
		targetPath = path.resolve(fileDir, urlPath);
	}

	// Add .md extension if not present
	if (!targetPath.endsWith('.md') && !path.extname(targetPath)) {
		targetPath += '.md';
	}

	// Check if file exists
	try {
		await fs.access(targetPath);

		// If anchor is specified, check if it exists
		if (anchor) {
			const anchors = await extractAnchorsFromFile(targetPath);
			if (!anchors.includes(anchor)) {
				return {
					link,
					status: 'broken',
					error: `Anchor #${anchor} not found in ${path.relative(docsDir, targetPath)}`
				};
			}
		}

		return { link, status: 'valid' };
	} catch {
		return {
			link,
			status: 'broken',
			error: `File not found: ${path.relative(docsDir, targetPath)}`
		};
	}
}

/**
 * Extract anchors from markdown file
 */
async function extractAnchorsFromFile(filePath: string): Promise<string[]> {
	const content = await fs.readFile(filePath, 'utf-8');
	const anchors: string[] = [];

	const tree = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.parse(content);

	visit(tree, 'heading', (node: any) => {
		if (node.children?.[0]?.value) {
			const text = node.children[0].value;
			const anchor = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
			anchors.push(anchor);
		}
	});

	return anchors;
}

/**
 * Check external links with rate limiting
 */
async function checkExternalLinks(
	links: DocumentLink[],
	config: LinkCheckerConfig
): Promise<LinkCheckResult[]> {
	const { timeout = 5000, concurrency = 10, skipDomains = [] } = config;
	const results: LinkCheckResult[] = [];
	const cache = new Map<string, LinkCheckResult>();

	// Filter out skipped domains
	const linksToCheck = links.filter(link => {
		const url = new URL(link.url);
		return !skipDomains.some(domain => url.hostname.includes(domain));
	});

	// Process in batches with concurrency limit
	for (let i = 0; i < linksToCheck.length; i += concurrency) {
		const batch = linksToCheck.slice(i, i + concurrency);
		const batchResults = await Promise.all(
			batch.map(link => checkExternalLink(link, timeout, cache))
		);
		results.push(...batchResults);
	}

	return results;
}

/**
 * Check single external link
 */
async function checkExternalLink(
	link: DocumentLink,
	timeout: number,
	cache: Map<string, LinkCheckResult>
): Promise<LinkCheckResult> {
	// Check cache first
	if (cache.has(link.url)) {
		const cached = cache.get(link.url)!;
		return { ...cached, link };
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(link.url, {
			method: 'HEAD',
			signal: controller.signal,
			redirect: 'follow'
		});

		clearTimeout(timeoutId);

		const result: LinkCheckResult = {
			link,
			status: response.ok ? 'valid' : 'broken',
			statusCode: response.status,
			error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`
		};

		cache.set(link.url, result);
		return result;
	} catch (error) {
		const result: LinkCheckResult = {
			link,
			status: 'broken',
			error: error instanceof Error ? error.message : 'Request failed'
		};

		cache.set(link.url, result);
		return result;
	}
}

/**
 * Generate summary report
 *
 * @public
 */
export function generateReport(results: LinkCheckResult[]): {
	total: number;
	valid: number;
	broken: number;
	warnings: number;
} {
	return {
		total: results.length,
		valid: results.filter(r => r.status === 'valid').length,
		broken: results.filter(r => r.status === 'broken').length,
		warnings: results.filter(r => r.status === 'warning').length
	};
}
