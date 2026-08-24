import { Command } from 'commander';
import { glob } from 'glob';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import packageManifest from '../package.json' with { type: 'json' };
import { extractLinksFromFiles } from './link-extractor.js';
import { validateLinks } from './link-validator.js';
import { printResults } from './reporter.js';
import { loadConfig, mergeConfig } from './config.js';
import type { LinkCheckerConfig } from './_linkModels.js';
import { createVersion, listVersions, deleteVersion } from './versioning.js';
import {
  generateApiReference,
  writeApiReferenceOutput,
  type ApiGeneratorConfig,
} from './api-generator.js';
import { createApiSymbolGenerator } from './apiSymbolGenerator.js';

/**
 * Get the CLI version from package.json
 */
function getVersion(): string {
  return packageManifest.version;
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
  .option('--public-dir <path>', 'Directory containing root-relative site assets')
  .option('--route-prefix <path>', 'URL route prefix mounted to the base directory')
  .option('-p, --pattern <glob>', 'Glob pattern for markdown files (default: **/*.md)')
  .option('-e, --external', 'Validate external links (slower)')
  .option('-t, --timeout <ms>', 'Timeout for external requests in ms (default: 5000)', '5000')
  .option('-c, --concurrency <num>', 'Max concurrent external requests (default: 10)', '10')
  .option('-q, --quiet', 'Only show errors')
  .option('-v, --verbose', 'Show all links including valid ones')
  .option('--json', 'Output results as JSON')
  .option('--config <path>', 'Path to config file')
  .action(async (options) => {
    if (process.env.BUILD_SKIP_LINK_CHECK === '1') {
      console.log('Link checking skipped (BUILD_SKIP_LINK_CHECK=1)');
      return;
    }

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
        publicDir: options.publicDir || fileConfig?.publicDir,
        routePrefix: options.routePrefix || fileConfig?.routePrefix,
        checkExternal: options.external || fileConfig?.checkExternal,
        timeout: parseInt(options.timeout, 10),
        concurrency: parseInt(options.concurrency, 10),
      });

      spinner.text = 'Finding markdown files...';

      // Find all markdown files
      const patterns = options.pattern ? [options.pattern] : config.include;
      const files = await glob(patterns, {
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

      const results = await validateLinks(links, config);

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

program
  .command('reference')
  .description('Extract a package API and generate its symbol map and Markdown reference')
  .option('-r, --root <path>', 'Package or repository root', '.')
  .option('-s, --source <patterns...>', 'Source patterns to scan', ['src/**/*.ts'])
  .option('-o, --output-dir <path>', 'Output directory', 'docs/api')
  .option('-e, --exclude <patterns...>', 'Patterns to exclude')
  .option('--cache-dir <path>', 'Cache directory', '.cache/docs-engine')
  .option('--cache-version <version>', 'Cache version', getVersion())
  .option('--title <title>', 'Reference page title', 'API Reference')
  .option('--repository-url <url>', 'Repository URL for source links')
  .option('--repository-branch <branch>', 'Repository branch for source links', 'main')
  .option('--repository-root <path>', 'Path from the repository root to the scanned root')
  .option('-w, --watch', 'Watch files and regenerate on changes')
  .option('-b, --benchmark', 'Run performance benchmark')
  .option('--debounce <ms>', 'Debounce delay for watch mode in ms', '500')
  .action(async (options) => {
    const rootDir = path.resolve(process.cwd(), options.root);
    const excludePatterns = options.exclude || [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/node_modules/**',
      '**/dist/**',
    ];
    const config: ApiGeneratorConfig = {
      rootDir,
      sourcePatterns: options.source,
      excludePatterns,
      outputDir: options.outputDir,
      cacheDir: options.cacheDir,
      cacheVersion: options.cacheVersion,
      title: options.title,
      repository: options.repositoryUrl
        ? {
            url: options.repositoryUrl,
            branch: options.repositoryBranch,
            sourceRoot: options.repositoryRoot,
          }
        : undefined,
    };

    try {
      if (options.benchmark) {
        const generator = createApiSymbolGenerator({
          sourcePatterns: config.sourcePatterns,
          excludePatterns: config.excludePatterns,
          outputPath: path.resolve(rootDir, config.outputDir, 'symbol-map.json'),
          cacheDir: path.resolve(rootDir, config.cacheDir),
          cacheVersion: config.cacheVersion,
          baseDir: rootDir,
        });
        const results = await generator.benchmark();
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      const spinner = ora('Generating API reference...').start();
      const result = await generateApiReference(config);
      spinner.succeed(`Generated ${result.symbolCount} public API symbol(s)`);
      console.log(chalk.gray(`  Reference: ${result.referencePath}`));
      console.log(chalk.gray(`  Symbol map: ${result.symbolMapPath}`));

      if (options.watch) {
        const generator = createApiSymbolGenerator({
          sourcePatterns: config.sourcePatterns,
          excludePatterns: config.excludePatterns,
          outputPath: result.symbolMapPath,
          cacheDir: path.resolve(rootDir, config.cacheDir),
          cacheVersion: config.cacheVersion,
          baseDir: rootDir,
        });
        const watcher = await generator.watch({
          debounce: parseInt(options.debounce, 10),
          onChange: (stats) => {
            writeApiReferenceOutput(config, stats.symbols);
            console.log(`Updated ${stats.symbolCount} symbol(s) in ${stats.duration}ms`);
          },
        });
        console.log('Watching source files. Press Ctrl+C to stop.');
        const shutdown = async (): Promise<void> => {
          await watcher.close();
          process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      }
    } catch (error) {
      console.error(chalk.red('API reference generation failed'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Parse CLI arguments
program.parse();
