#!/usr/bin/env node

import { Command } from 'commander';
import { glob } from 'glob';
import ora from 'ora';
import { extractLinksFromFiles } from './link-extractor.js';
import { validateLinks } from './link-validator.js';
import { printResults } from './reporter.js';
import { loadConfig, mergeConfig } from './config.js';
import type { LinkCheckerConfig } from './config.js';

/**
 * Main CLI program
 *
 * Provides commands for:
 * - Link checking
 * - Link validation
 * - Documentation maintenance
 *
 * @public
 */
const program = new Command();

program
	.name('docs-engine')
	.description('CLI tools for docs-engine - link checking, validation, and maintenance')
	.version('1.0.0');

/**
 * Check links command
 *
 * Usage:
 * ```bash
 * docs-engine check-links
 * docs-engine check-links --external
 * docs-engine check-links --quiet
 * docs-engine check-links --json > results.json
 * ```
 */
program
	.command('check-links')
	.description('Check all links in markdown documentation')
	.option('-b, --base-dir <path>', 'Base directory for docs (default: current directory)')
	.option('-p, --pattern <glob>', 'Glob pattern for markdown files (default: **/*.md)')
	.option('-e, --external', 'Validate external links (slower)')
	.option('-t, --timeout <ms>', 'Timeout for external requests in ms (default: 5000)', '5000')
	.option('-c, --concurrency <num>', 'Max concurrent external requests (default: 10)', '10')
	.option('-q, --quiet', 'Only show errors')
	.option('-v, --verbose', 'Show all links including valid ones')
	.option('--json', 'Output results as JSON')
	.option('--config <path>', 'Path to config file')
	.action(async (options) => {
		const spinner = ora('Initializing link checker...').start();

		try {
			// Load configuration
			let fileConfig: LinkCheckerConfig | undefined;
			if (options.config) {
				try {
					const { readFileSync } = await import('fs');
					fileConfig = JSON.parse(readFileSync(options.config, 'utf-8')) as LinkCheckerConfig;
				} catch {
					fileConfig = undefined;
				}
			} else {
				fileConfig = loadConfig();
			}

			const config = mergeConfig({
				...fileConfig,
				baseDir: options.baseDir || fileConfig?.baseDir,
				checkExternal: options.external || fileConfig?.checkExternal,
				timeout: parseInt(options.timeout, 10),
				concurrency: parseInt(options.concurrency, 10)
			});

			spinner.text = 'Finding markdown files...';

			// Find all markdown files
			const pattern = options.pattern || config.include.join(',');
			const files = await glob(pattern, {
				cwd: config.baseDir,
				absolute: true,
				ignore: config.exclude
			});

			if (files.length === 0) {
				spinner.fail('No markdown files found');
				process.exit(1);
			}

			spinner.succeed(`Found ${files.length} markdown file(s)`);

			// Extract links
			spinner.start('Extracting links...');
			const links = extractLinksFromFiles(files);
			spinner.succeed(`Extracted ${links.length} link(s)`);

			// Validate links
			spinner.start(
				config.checkExternal ? 'Validating links (including external)...' : 'Validating internal links...'
			);

			const results = await validateLinks(links, {
				baseDir: config.baseDir,
				checkExternal: config.checkExternal,
				timeout: config.timeout,
				concurrency: config.concurrency,
				skipDomains: config.skipDomains,
				validExtensions: config.validExtensions
			});

			spinner.succeed('Validation complete');

			// Print results
			printResults(results, {
				quiet: options.quiet,
				verbose: options.verbose,
				json: options.json
			});

			// Exit with error code if broken links found
			const brokenCount = results.filter((r) => !r.isValid).length;
			if (brokenCount > 0) {
				process.exit(1);
			}
		} catch (error) {
			spinner.fail('Link checking failed');
			console.error(error);
			process.exit(1);
		}
	});

/**
 * Version command
 */
program
	.command('version')
	.description('Show version information')
	.action(() => {
		console.log('docs-engine CLI v1.0.0');
		console.log('Part of @goobits/docs-engine');
	});

// Parse CLI arguments
program.parse();
