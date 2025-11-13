#!/usr/bin/env node
/**
 * Generate symbol map for documentation
 */

import { createSymbolMapGenerator } from './src/lib/utils/symbol-generation.js';
import { createLogger } from './src/lib/utils/logger.js';

const logger = createLogger('generate-symbols');

const generator = createSymbolMapGenerator({
  sourcePatterns: ['src/lib/**/*.ts'],
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
  cacheDir: '.dev/tmp',
  cacheVersion: '1.0.0',
  outputPath: 'docs/.generated/symbol-map.json',
  baseDir: process.cwd(),
});

logger.info('Generating symbol map for docs-engine');

try {
  await generator.generate();
  logger.info('Symbol map generation complete');
  process.exit(0);
} catch (error) {
  logger.error({ error }, 'Symbol map generation failed');
  process.exit(1);
}
