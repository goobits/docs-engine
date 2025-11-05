/**
 * Git Integration Utilities
 *
 * Provides utilities for extracting Git metadata and generating edit links
 * for documentation pages. Supports GitHub, GitLab, and Gitea providers.
 */

import { execSync } from 'child_process';

/**
 * Git configuration for repository integration
 */
export interface GitConfig {
	/** Repository URL (e.g., "https://github.com/user/repo") */
	repoUrl: string;
	/** Branch name (default: "main") */
	branch?: string;
	/** Path to docs directory within repo (default: "docs") */
	docsPath?: string;
	/** Text for edit link (default: "Edit this page") */
	editLinkText?: string;
}

/**
 * Contributor information from Git history
 */
export interface Contributor {
	name: string;
	email: string;
	commits: number;
	avatar?: string;
}

/**
 * Git provider type
 */
export type GitProvider = 'github' | 'gitlab' | 'gitea' | 'unknown';

/**
 * Cache for Git command results to improve performance
 */
const gitCache = new Map<string, unknown>();

/**
 * Execute a git command safely with caching
 */
function execGitCommand(command: string, cacheKey: string, ttl = 60000): string | null {
	// Check cache first
	const cached = gitCache.get(cacheKey);
	if (cached && typeof cached === 'object' && 'value' in cached && 'timestamp' in cached) {
		const { value, timestamp } = cached as { value: string; timestamp: number };
		if (Date.now() - timestamp < ttl) {
			return value;
		}
	}

	try {
		const result = execSync(command, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		}).trim();

		// Cache the result
		gitCache.set(cacheKey, { value: result, timestamp: Date.now() });
		return result;
	} catch (error) {
		// Log warning but don't break the build
		if (process.env.NODE_ENV !== 'test') {
			console.warn(`Git command failed: ${command}`, error);
		}
		return null;
	}
}

/**
 * Get the last updated date for a file from Git history
 *
 * @param filePath - Relative path to the file from repository root
 * @returns Date of last commit, or null if unavailable
 *
 * @example
 * ```typescript
 * const lastUpdated = getLastUpdated('docs/getting-started.md');
 * // Returns: Date object or null
 * ```
 *
 * @public
 */
export function getLastUpdated(filePath: string): Date | null {
	const cacheKey = `lastUpdated:${filePath}`;
	const result = execGitCommand(
		`git log -1 --format=%ai "${filePath}"`,
		cacheKey
	);

	if (!result) return null;

	const date = new Date(result);
	return isNaN(date.getTime()) ? null : date;
}

/**
 * Get contributors for a file from Git history
 *
 * @param filePath - Relative path to the file from repository root
 * @param limit - Maximum number of contributors to return (default: 10)
 * @returns Array of contributors sorted by commit count
 *
 * @example
 * ```typescript
 * const contributors = getContributors('docs/getting-started.md', 5);
 * // Returns: [{ name: 'John Doe', email: 'john@example.com', commits: 15 }, ...]
 * ```
 *
 * @public
 */
export function getContributors(filePath: string, limit = 10): Contributor[] {
	const cacheKey = `contributors:${filePath}:${limit}`;
	const cached = gitCache.get(cacheKey);

	if (cached && typeof cached === 'object' && 'value' in cached && 'timestamp' in cached) {
		const { value, timestamp } = cached as { value: Contributor[]; timestamp: number };
		if (Date.now() - timestamp < 60000) {
			return value;
		}
	}

	const result = execGitCommand(
		`git log --format="%an|%ae" "${filePath}"`,
		`contributors-raw:${filePath}`
	);

	if (!result) return [];

	// Count commits per contributor
	const contributorMap = new Map<string, Contributor>();

	result.split('\n').forEach((line) => {
		const [name, email] = line.split('|');
		if (!name || !email) return;

		const key = email.toLowerCase();
		const existing = contributorMap.get(key);

		if (existing) {
			existing.commits++;
		} else {
			contributorMap.set(key, {
				name,
				email,
				commits: 1,
				avatar: generateGravatarUrl(email),
			});
		}
	});

	// Sort by commit count and limit
	const contributors = Array.from(contributorMap.values())
		.sort((a, b) => b.commits - a.commits)
		.slice(0, limit);

	// Cache the result
	gitCache.set(cacheKey, { value: contributors, timestamp: Date.now() });

	return contributors;
}

/**
 * Detect Git provider from repository URL
 */
function detectGitProvider(repoUrl: string): GitProvider {
	const url = repoUrl.toLowerCase();
	if (url.includes('github.com')) return 'github';
	if (url.includes('gitlab.com') || url.includes('gitlab.')) return 'gitlab';
	if (url.includes('gitea.')) return 'gitea';
	return 'unknown';
}

/**
 * Generate edit link for a file based on Git provider
 *
 * @param filePath - Relative path to the file from docs root
 * @param config - Git configuration
 * @returns URL to edit the file on the Git provider
 *
 * @example
 * ```typescript
 * const editLink = generateEditLink('getting-started.md', {
 *   repoUrl: 'https://github.com/user/repo',
 *   branch: 'main',
 *   docsPath: 'docs'
 * });
 * // Returns: "https://github.com/user/repo/edit/main/docs/getting-started.md"
 * ```
 *
 * @public
 */
export function generateEditLink(filePath: string, config: GitConfig): string {
	const { repoUrl, branch = 'main', docsPath = 'docs' } = config;
	const provider = detectGitProvider(repoUrl);

	// Remove trailing slash from repoUrl
	const baseUrl = repoUrl.replace(/\/$/, '');

	// Construct file path within repository
	const fullPath = docsPath ? `${docsPath}/${filePath}` : filePath;

	switch (provider) {
		case 'github':
			return `${baseUrl}/edit/${branch}/${fullPath}`;

		case 'gitlab':
			return `${baseUrl}/-/edit/${branch}/${fullPath}`;

		case 'gitea':
			return `${baseUrl}/_edit/${branch}/${fullPath}`;

		default:
			// Fallback to GitHub format
			return `${baseUrl}/edit/${branch}/${fullPath}`;
	}
}

/**
 * Generate Gravatar URL from email address
 */
function generateGravatarUrl(email: string): string {
	// Simple MD5 alternative for browser compatibility
	// In production, you might want to use a proper crypto library
	const hash = simpleHash(email.toLowerCase().trim());
	return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=40`;
}

/**
 * Simple hash function for generating Gravatar URLs
 * Note: This is NOT cryptographically secure, just for avatar generation
 */
function simpleHash(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Check if the current directory is a Git repository
 *
 * @public
 */
export function isGitRepository(): boolean {
	try {
		execSync('git rev-parse --git-dir', {
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Format a date relative to now (e.g., "2 days ago")
 *
 * @public
 */
export function formatRelativeDate(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'today';
	if (diffDays === 1) return 'yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Clear the Git cache (useful for testing)
 *
 * @public
 */
export function clearGitCache(): void {
	gitCache.clear();
}
