/**
 * Symbol Map Watcher
 *
 * Watches TypeScript files and automatically regenerates symbol map
 * when changes are detected.
 *
 * @module
 */

import { createSymbolMapGenerator } from '@goobits/docs-engine/server';
import type { SymbolMapGeneratorConfig } from '@goobits/docs-engine/server';

export interface WatchOptions {
	/** Debounce delay in milliseconds (default: 500) */
	debounce?: number;
	/** Callback when symbol map is updated */
	onChange?: (stats: { duration: number; symbolCount: number }) => void;
	/** Show verbose output */
	verbose?: boolean;
}

/**
 * Watch TypeScript files and regenerate symbol map on changes
 *
 * @param config - Symbol map generator configuration
 * @param options - Watch options
 * @returns Promise that resolves with watcher instance
 *
 * @example
 * ```typescript
 * const watcher = await watchSymbols({
 *   sourcePatterns: ['src/**\/*.ts'],
 *   outputPath: 'docs/symbol-map.json'
 * }, {
 *   debounce: 500,
 *   onChange: (stats) => console.log(`Updated: ${stats.symbolCount} symbols`)
 * });
 *
 * // Stop watching
 * await watcher.close();
 * ```
 *
 * @public
 */
export async function watchSymbols(config: SymbolMapGeneratorConfig, options: WatchOptions = {}) {
	const { debounce = 500, onChange, verbose = false } = options;

	if (verbose) {
		console.log('🚀 Starting TypeScript file watcher...');
		console.log(`   Source patterns: ${config.sourcePatterns.join(', ')}`);
		console.log(`   Output: ${config.outputPath}`);
	}

	const generator = createSymbolMapGenerator(config);

	// Start watching
	const watcher = await generator.watch({
		debounce,
		onChange: (stats) => {
			if (onChange) {
				onChange(stats);
			} else if (verbose) {
				console.log(
					`✅ Symbol map updated (${(stats.duration / 1000).toFixed(1)}s, ${stats.symbolCount} symbols)`
				);
			}
		}
	});

	if (verbose) {
		console.log('\n👀 Watching TypeScript files for changes...');
		console.log('   Press Ctrl+C to stop\n');
	}

	return watcher;
}
