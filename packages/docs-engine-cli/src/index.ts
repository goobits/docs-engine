#!/usr/bin/env node

import { Command } from 'commander';
import { glob } from 'glob';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractLinksFromFiles } from './link-extractor.js';
import { validateLinks } from './link-validator.js';
import { printResults } from './reporter.js';
import { loadConfig, mergeConfig } from './config.js';
import type { LinkCheckerConfig } from './config.js';
import { createVersion, listVersions, deleteVersion } from './versioning.js';
import { generateApiDocs } from './api-generator.js';
import { watchSymbols } from './symbol-watcher.js';
import { benchmarkSymbols, printBenchmarkResults } from './symbol-benchmarker.js';

/**
 * Get the CLI version from package.json
 */
function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Main CLI program
 *
 * Provides commands for:
 * - Link checking and validation
 * - Documentation versioning
 * - Symbol map generation and watching
 * - Documentation maintenance
 *
 * @public
 */
const program = new Command();

program
  .name('docs-engine')
  .description('CLI tools for docs-engine - link checking, versioning, and validation')
  .version(getVersion());

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
        concurrency: parseInt(options.concurrency, 10),
      });

      spinner.text = 'Finding markdown files...';

      // Find all markdown files
      const pattern = options.pattern || config.include.join(',');
      const files = await glob(pattern, {
        cwd: config.baseDir,
        absolute: true,
        ignore: config.exclude,
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
        config.checkExternal
          ? 'Validating links (including external)...'
          : 'Validating internal links...'
      );

      const results = await validateLinks(links, {
        baseDir: config.baseDir,
        checkExternal: config.checkExternal,
        timeout: config.timeout,
        concurrency: config.concurrency,
        skipDomains: config.skipDomains,
        validExtensions: config.validExtensions,
      });

      spinner.succeed('Validation complete');

      // Print results
      printResults(results, {
        quiet: options.quiet,
        verbose: options.verbose,
        json: options.json,
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
 * Version management commands
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
      console.log(
        chalk.gray(
          `  - Version created in ${path.join(docsDir, 'versioned_docs', `version-${version}`)}`
        )
      );
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
      versions.forEach((version) => {
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

/**
 * API documentation generation command
 */
program
  .command('generate-api')
  .description('Generate API documentation from TypeScript source files')
  .option('-e, --entry-points <paths...>', 'TypeScript files or glob patterns to parse', [
    'src/**/*.ts',
  ])
  .option('-o, --output-dir <path>', 'Output directory for generated markdown', 'docs/api')
  .option('-t, --tsconfig <path>', 'Path to tsconfig.json')
  .option('--exclude <patterns...>', 'Patterns to exclude from parsing')
  .option('--base-url <url>', 'Base URL for type links (e.g., /api)')
  .option('--repo-url <url>', 'Repository URL for source links')
  .option('--repo-branch <branch>', 'Repository branch for source links', 'main')
  .option('--no-index', 'Skip generating index file')
  .option('--source-links', 'Include links to source code')
  .action(async (options) => {
    const spinner = ora('Generating API documentation...').start();

    try {
      await generateApiDocs({
        entryPoints: options.entryPoints,
        outputDir: path.resolve(process.cwd(), options.outputDir),
        tsConfigPath: options.tsconfig ? path.resolve(process.cwd(), options.tsconfig) : undefined,
        exclude: options.exclude,
        generateIndex: options.index,
        markdownConfig: {
          baseUrl: options.baseUrl,
          repoUrl: options.repoUrl,
          repoBranch: options.repoBranch,
          includeSourceLinks: options.sourceLinks,
        },
      });

      const filesCount = options.entryPoints.length;
      spinner.succeed(`API documentation generated successfully!`);

      console.log(chalk.cyan('\nGenerated files:'));
      console.log(chalk.gray(`  Output directory: ${options.outputDir}`));
      console.log(chalk.gray(`  Entry points: ${filesCount} pattern(s)`));

      if (options.index) {
        console.log(chalk.gray(`  Index file: ${path.join(options.outputDir, 'index.md')}`));
      }
    } catch (error) {
      spinner.fail('API documentation generation failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      if (error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

/**
 * Symbol map generation command
 */
program
  .command('symbols')
  .description('Generate, watch, or benchmark symbol map from TypeScript sources')
  .option('-s, --source <patterns...>', 'Source patterns to scan', ['src/**/*.ts'])
  .option('-o, --output <path>', 'Output path for symbol map', 'docs/symbol-map.json')
  .option('-e, --exclude <patterns...>', 'Patterns to exclude')
  .option('--cache-dir <path>', 'Cache directory', '.cache')
  .option('--cache-version <version>', 'Cache version', '1.0')
  .option('-w, --watch', 'Watch files and regenerate on changes')
  .option('-b, --benchmark', 'Run performance benchmark')
  .option('--debounce <ms>', 'Debounce delay for watch mode in ms', '500')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (options) => {
    try {
      const config = {
        sourcePatterns: options.source,
        excludePatterns: options.exclude || [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/node_modules/**',
          '**/dist/**',
        ],
        outputPath: path.resolve(process.cwd(), options.output),
        cacheDir: options.cacheDir,
        cacheVersion: options.cacheVersion,
        baseDir: process.cwd(),
      };

      // Benchmark mode
      if (options.benchmark) {
        const spinner = ora('Running benchmark...').start();
        spinner.text = '🔬 Symbol Map Generation Benchmark';
        spinner.stop();

        console.log('='.repeat(50));
        console.log('Running performance tests...\n');

        const results = await benchmarkSymbols(config);
        printBenchmarkResults(results);
        return;
      }

      // Watch mode
      if (options.watch) {
        console.log('🚀 Starting TypeScript file watcher...');
        console.log(`   Source: ${options.source.join(', ')}`);
        console.log(`   Output: ${options.output}\n`);

        const watcher = await watchSymbols(config, {
          debounce: parseInt(options.debounce, 10),
          verbose: options.verbose,
          onChange: (stats) => {
            console.log(
              `✅ Symbol map updated (${(stats.duration / 1000).toFixed(1)}s, ${stats.symbolCount} symbols)`
            );
            console.log('\n👀 Watching TypeScript files for changes...');
          },
        });

        console.log('👀 Watching TypeScript files for changes...');
        console.log('   Press Ctrl+C to stop\n');

        // Handle graceful shutdown
        const shutdown = async (): Promise<void> => {
          console.log('\n\n👋 Stopping file watcher...');
          await watcher.close();
          console.log('✅ File watcher stopped');
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        return;
      }

      // Normal generation mode
      const spinner = ora('Generating symbol map...').start();
      const startTime = Date.now();
      const { createSymbolMapGenerator } = await import('@goobits/docs-engine/server');

      const generator = createSymbolMapGenerator(config);
      const symbolMap = await generator.generate();
      const duration = Date.now() - startTime;
      const symbolCount = Object.values(symbolMap).flat().length;

      spinner.succeed('Symbol map generated successfully!');
      console.log(chalk.cyan('\nGenerated:'));
      console.log(chalk.gray(`  Output: ${options.output}`));
      console.log(chalk.gray(`  Symbols: ${symbolCount}`));
      console.log(chalk.gray(`  Duration: ${(duration / 1000).toFixed(2)}s`));
    } catch (error) {
      console.error(chalk.red('Symbol generation failed'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      if (error instanceof Error && error.stack && options.verbose) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Parse CLI arguments
program.parse();
