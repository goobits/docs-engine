#!/usr/bin/env node
/**
 * Generate symbol map for documentation
 */

import { createSymbolMapGenerator } from './src/lib/utils/symbol-generation.js';

const generator = createSymbolMapGenerator({
  sourcePatterns: ['src/lib/**/*.ts'],
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
  cacheDir: '.dev/tmp',
  cacheVersion: '1.0.0',
  outputPath: 'docs/.generated/symbol-map.json',
  baseDir: process.cwd(),
});

console.log('🚀 Generating symbol map for docs-engine...\n');

try {
  await generator.generate();
  console.log('\n✅ Symbol map generation complete!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Symbol map generation failed:', error);
  process.exit(1);
}
