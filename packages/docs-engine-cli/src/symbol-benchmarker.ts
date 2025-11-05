/**
 * Symbol Map Benchmarker
 *
 * Benchmarks symbol map generation performance with different cache scenarios.
 *
 * @module
 */

import { createSymbolMapGenerator } from '@goobits/docs-engine/server';
import type { SymbolMapGeneratorConfig } from '@goobits/docs-engine/server';

export interface BenchmarkResults {
	/** Cold run time (no cache) in milliseconds */
	cold: number;
	/** Warm run time (with cache, no changes) in milliseconds */
	warm: number;
	/** Warm run time (with cache, 1 file changed) in milliseconds */
	warmWithChange: number;
	/** Performance improvement percentage */
	improvement: number;
	/** Cache file size in bytes */
	cacheSize: number;
	/** Number of symbols generated */
	symbolCount: number;
}

/**
 * Run benchmark for symbol map generation
 *
 * Tests performance in three scenarios:
 * 1. Cold run (no cache)
 * 2. Warm run (with cache, no changes)
 * 3. Warm run (with cache, 1 file changed)
 *
 * @param config - Symbol map generator configuration
 * @returns Promise that resolves with benchmark results
 *
 * @example
 * ```typescript
 * const results = await benchmarkSymbols({
 *   sourcePatterns: ['src/**\/*.ts'],
 *   outputPath: 'docs/symbol-map.json'
 * });
 *
 * console.log(`Cold: ${results.cold}ms`);
 * console.log(`Warm: ${results.warm}ms`);
 * console.log(`Improvement: ${results.improvement}%`);
 * ```
 *
 * @public
 */
export async function benchmarkSymbols(config: SymbolMapGeneratorConfig): Promise<BenchmarkResults> {
	const generator = createSymbolMapGenerator(config);
	return await generator.benchmark();
}

/**
 * Format and print benchmark results
 *
 * @param results - Benchmark results
 *
 * @public
 */
export function printBenchmarkResults(results: BenchmarkResults): void {
	console.log('\n' + '='.repeat(50));
	console.log('📈 Benchmark Results:\n');
	console.log(`Cold run:             ${results.cold}ms (${(results.cold / 1000).toFixed(2)}s)`);
	console.log(`Warm run (no change): ${results.warm}ms (${(results.warm / 1000).toFixed(2)}s)`);
	console.log(
		`Warm run (1 change):  ${results.warmWithChange}ms (${(results.warmWithChange / 1000).toFixed(2)}s)`
	);
	console.log(`\nImprovement:          ${results.improvement.toFixed(1)}% faster`);
	console.log(`Target achieved:      ${results.warm < 1000 ? '✅ Yes' : '❌ No'} (target: <1000ms)`);
	console.log(`\n💾 Cache file size:    ${(results.cacheSize / 1024).toFixed(2)} KB`);
	console.log(`🔤 Symbol count:       ${results.symbolCount}`);
	console.log('='.repeat(50) + '\n');
}
