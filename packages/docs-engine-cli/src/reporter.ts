import chalk from 'chalk';
import type { ValidationResult } from './link-validator.js';
import type { ExtractedLink } from './link-extractor.js';

/**
 * Report statistics
 *
 * @public
 */
export interface ReportStats {
	/** Total links checked */
	total: number;
	/** Valid links */
	valid: number;
	/** Broken links */
	broken: number;
	/** External links checked */
	external: number;
	/** Internal links checked */
	internal: number;
}

/**
 * Calculate statistics from validation results
 *
 * @param results - Validation results
 * @returns Report statistics
 *
 * @internal
 */
export function calculateStats(results: ValidationResult[]): ReportStats {
	return {
		total: results.length,
		valid: results.filter((r) => r.isValid).length,
		broken: results.filter((r) => !r.isValid).length,
		external: results.filter((r) => r.link.isExternal).length,
		internal: results.filter((r) => !r.link.isExternal).length
	};
}

/**
 * Group validation results by error type
 *
 * @param results - Validation results
 * @returns Grouped results
 *
 * @internal
 */
export function groupByErrorType(results: ValidationResult[]): {
	notFound: ValidationResult[];
	brokenAnchor: ValidationResult[];
	externalError: ValidationResult[];
	timeout: ValidationResult[];
} {
	const broken = results.filter((r) => !r.isValid);

	return {
		notFound: broken.filter((r) => r.error?.includes('not found')),
		brokenAnchor: broken.filter((r) => r.error?.includes('Anchor')),
		externalError: broken.filter((r) => r.link.isExternal && r.statusCode && r.statusCode >= 400),
		timeout: broken.filter((r) => r.error?.includes('timeout') || r.error?.includes('aborted'))
	};
}

/**
 * Format a link location for display
 *
 * @param link - Link to format
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * formatLinkLocation(link);
 * // Returns: "docs/guide.md:42"
 * ```
 *
 * @internal
 */
export function formatLinkLocation(link: ExtractedLink): string {
	return `${link.file}:${link.line}`;
}

/**
 * Print validation results to console
 *
 * @param results - Validation results
 * @param options - Output options
 *
 * @example
 * ```typescript
 * printResults(results, { quiet: false, verbose: true });
 * ```
 *
 * @public
 */
export function printResults(
	results: ValidationResult[],
	options: {
		quiet?: boolean;
		verbose?: boolean;
		json?: boolean;
	} = {}
): void {
	const { quiet = false, verbose = false, json = false } = options;

	// JSON output
	if (json) {
		console.log(JSON.stringify(results, null, 2));
		return;
	}

	const stats = calculateStats(results);
	const grouped = groupByErrorType(results);

	// Quiet mode - only show errors
	if (quiet) {
		const broken = results.filter((r) => !r.isValid);
		broken.forEach((result) => {
			console.error(`${formatLinkLocation(result.link)} - ${result.link.url} - ${result.error}`);
		});
		return;
	}

	// Print header
	console.log(chalk.bold('\n🔍 Link Validation Results\n'));

	// Print broken links by category
	if (grouped.notFound.length > 0) {
		console.log(chalk.red.bold(`\n❌ Files Not Found (${grouped.notFound.length}):\n`));
		grouped.notFound.forEach((result) => {
			console.log(
				`  ${chalk.gray(formatLinkLocation(result.link))} ${chalk.yellow(result.link.url)}`
			);
			console.log(`    ${chalk.red(result.error)}`);
		});
	}

	if (grouped.brokenAnchor.length > 0) {
		console.log(chalk.red.bold(`\n❌ Broken Anchors (${grouped.brokenAnchor.length}):\n`));
		grouped.brokenAnchor.forEach((result) => {
			console.log(
				`  ${chalk.gray(formatLinkLocation(result.link))} ${chalk.yellow(result.link.url)}`
			);
			console.log(`    ${chalk.red(result.error)}`);
		});
	}

	if (grouped.externalError.length > 0) {
		console.log(chalk.red.bold(`\n❌ External Link Errors (${grouped.externalError.length}):\n`));
		grouped.externalError.forEach((result) => {
			console.log(
				`  ${chalk.gray(formatLinkLocation(result.link))} ${chalk.yellow(result.link.url)}`
			);
			console.log(
				`    ${chalk.red(`HTTP ${result.statusCode}`)} ${result.error ? `- ${result.error}` : ''}`
			);
		});
	}

	if (grouped.timeout.length > 0) {
		console.log(chalk.yellow.bold(`\n⚠️  Timeouts (${grouped.timeout.length}):\n`));
		grouped.timeout.forEach((result) => {
			console.log(
				`  ${chalk.gray(formatLinkLocation(result.link))} ${chalk.yellow(result.link.url)}`
			);
			console.log(`    ${chalk.yellow(result.error)}`);
		});
	}

	// Print verbose output (all links)
	if (verbose) {
		console.log(chalk.green.bold(`\n✓ Valid Links (${stats.valid}):\n`));
		results
			.filter((r) => r.isValid)
			.forEach((result) => {
				console.log(
					`  ${chalk.gray(formatLinkLocation(result.link))} ${chalk.green('✓')} ${result.link.url}`
				);
			});
	}

	// Print summary
	console.log(chalk.bold('\n📊 Summary:\n'));
	console.log(`  Total links:     ${chalk.cyan(stats.total.toString())}`);
	console.log(`  Valid:           ${chalk.green(stats.valid.toString())}`);
	console.log(`  Broken:          ${stats.broken > 0 ? chalk.red(stats.broken.toString()) : chalk.green('0')}`);
	console.log(`  Internal:        ${chalk.cyan(stats.internal.toString())}`);
	console.log(`  External:        ${chalk.cyan(stats.external.toString())}`);

	// Success or failure message
	if (stats.broken === 0) {
		console.log(chalk.green.bold('\n✨ All links are valid!\n'));
	} else {
		console.log(chalk.red.bold(`\n💔 Found ${stats.broken} broken link(s)\n`));
	}
}

/**
 * Print progress update
 *
 * @param message - Progress message
 * @param current - Current item number
 * @param total - Total items
 *
 * @public
 */
export function printProgress(message: string, current: number, total: number): void {
	const percentage = Math.round((current / total) * 100);
	const bar = '█'.repeat(Math.floor(percentage / 5));
	const empty = '░'.repeat(20 - bar.length);

	process.stdout.write(`\r${message} [${bar}${empty}] ${percentage}% (${current}/${total})`);

	if (current === total) {
		process.stdout.write('\n');
	}
}
