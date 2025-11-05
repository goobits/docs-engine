#!/usr/bin/env node

/**
 * docs-engine CLI
 *
 * CLI tools for docs-engine including link checker and version management.
 *
 * Commands:
 *   check-links     - Validate internal and external links
 *   version create  - Create new documentation version
 *   version list    - List all versions
 *   version delete  - Delete a version
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { promises as fs } from 'fs';
import {
	extractLinks,
	checkLinks,
	generateReport,
	type LinkCheckerConfig,
	type LinkCheckResult
} from './link-checker.js';
import { createVersion, listVersions, deleteVersion } from './versioning.js';

const program = new Command();

program
	.name('docs-engine')
	.description('CLI tools for docs-engine')
	.version('1.0.0');

/**
 * Link Checker Command
 */
program
	.command('check-links')
	.description('Validate all links in documentation')
	.option('-d, --docs-dir <path>', 'Documentation directory', 'docs')
	.option('-e, --external', 'Check external links', false)
	.option('-t, --timeout <ms>', 'External link timeout in ms', '5000')
	.option('-c, --concurrency <n>', 'Max concurrent external requests', '10')
	.option('--skip-domains <domains>', 'Domains to skip (comma-separated)', '')
	.option('--json', 'Output JSON format', false)
	.option('-q, --quiet', 'Only show errors', false)
	.action(async (options) => {
		const config: LinkCheckerConfig = {
			docsDir: path.resolve(process.cwd(), options.docsDir),
			checkExternal: options.external,
			timeout: parseInt(options.timeout),
			concurrency: parseInt(options.concurrency),
			skipDomains: options.skipDomains ? options.skipDomains.split(',') : []
		};

		const spinner = ora('Extracting links...').start();

		try {
			// Extract links
			const links = await extractLinks(config);
			spinner.succeed(`Found ${links.length} links`);

			// Check links
			spinner.text = 'Checking links...';
			spinner.start();
			const results = await checkLinks(links, config);
			spinner.stop();

			// Generate report
			const summary = generateReport(results);
			const brokenLinks = results.filter(r => r.status === 'broken');

			// Output
			if (options.json) {
				console.log(JSON.stringify({ summary, results }, null, 2));
			} else {
				// Print summary
				console.log('\n' + chalk.bold('Link Check Summary:'));
				console.log(chalk.green(`✓ Valid: ${summary.valid}`));
				if (summary.broken > 0) {
					console.log(chalk.red(`✗ Broken: ${summary.broken}`));
				}
				if (summary.warnings > 0) {
					console.log(chalk.yellow(`⚠ Warnings: ${summary.warnings}`));
				}

				// Print broken links
				if (brokenLinks.length > 0 && !options.quiet) {
					console.log('\n' + chalk.bold.red('Broken Links:'));
					brokenLinks.forEach(({ link, error }) => {
						console.log(chalk.red(`\n✗ ${link.filePath}${link.lineNumber ? `:${link.lineNumber}` : ''}`));
						console.log(chalk.gray(`  URL: ${link.url}`));
						console.log(chalk.gray(`  Text: ${link.text}`));
						if (error) {
							console.log(chalk.red(`  Error: ${error}`));
						}
					});
				}
			}

			// Exit with error code if broken links found
			if (summary.broken > 0) {
				process.exit(1);
			}
		} catch (error) {
			spinner.fail('Link check failed');
			console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
			process.exit(1);
		}
	});

/**
 * Version Commands
 */
const versionCmd = program.command('version').description('Manage documentation versions');

versionCmd
	.command('create <version>')
	.description('Create new documentation version from current docs')
	.option('-d, --docs-dir <path>', 'Documentation directory', 'docs')
	.action(async (version: string, options) => {
		const spinner = ora(`Creating version ${version}...`).start();

		try {
			const docsDir = path.resolve(process.cwd(), options.docsDir);
			await createVersion(version, docsDir);
			spinner.succeed(`Version ${version} created successfully!`);

			console.log(chalk.cyan('\nNext steps:'));
			console.log(chalk.gray(`  - Version created in ${path.join(docsDir, 'versioned_docs', `version-${version}`)}`));
			console.log(chalk.gray(`  - Updated versions.json`));
			console.log(chalk.gray(`  - Deploy your updated documentation`));
		} catch (error) {
			spinner.fail('Failed to create version');
			console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
			process.exit(1);
		}
	});

versionCmd
	.command('list')
	.description('List all documentation versions')
	.option('-d, --docs-dir <path>', 'Documentation directory', 'docs')
	.action(async (options) => {
		try {
			const docsDir = path.resolve(process.cwd(), options.docsDir);
			const versions = await listVersions(docsDir);

			if (versions.length === 0) {
				console.log(chalk.yellow('No versions found'));
				return;
			}

			console.log(chalk.bold('\nDocumentation Versions:'));
			versions.forEach(version => {
				const label = version.label ? chalk.cyan(` [${version.label}]`) : '';
				console.log(`  ${version.version}${label}`);
			});
			console.log();
		} catch (error) {
			console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
			process.exit(1);
		}
	});

versionCmd
	.command('delete <version>')
	.description('Delete a documentation version')
	.option('-d, --docs-dir <path>', 'Documentation directory', 'docs')
	.option('-f, --force', 'Skip confirmation', false)
	.action(async (version: string, options) => {
		const spinner = ora(`Deleting version ${version}...`).start();

		try {
			const docsDir = path.resolve(process.cwd(), options.docsDir);
			await deleteVersion(version, docsDir);
			spinner.succeed(`Version ${version} deleted successfully!`);
		} catch (error) {
			spinner.fail('Failed to delete version');
			console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
			process.exit(1);
		}
	});

// Parse and execute
program.parse(process.argv);
