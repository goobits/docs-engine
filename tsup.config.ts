import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { createLogger } from '@goobits/logger';

const logger = createLogger('tsup-build');

/**
 * Recursively copy files matching a pattern from src to dist
 */
function copyFiles(srcDir: string, destDir: string, pattern: RegExp): void {
  const items = readdirSync(srcDir);

  for (const item of items) {
    const srcPath = join(srcDir, item);
    const destPath = join(destDir, item);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      if (item === '__fixtures__') continue;
      mkdirSync(destPath, { recursive: true });
      copyFiles(srcPath, destPath, pattern);
    } else if (pattern.test(item)) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
      logger.debug('Copied file', { file: relative(process.cwd(), destPath) });
    }
  }
}

export default defineConfig({
  // Entry points for all public APIs
  entry: [
    'src/lib/index.ts',
    'src/lib/server/index.ts',
    'src/lib/server/markdownRenderer.ts',
    'src/lib/server/screenshot-service.ts',
    'src/lib/plugins/index.ts',
    'src/lib/reference.ts',
    'src/lib/sveltekit/index.ts',
    'src/lib/utils/index.ts',
    'src/lib/utils/navigation-scanner.ts',
    'src/lib/utils/openapi-formatter.ts',
    'src/lib/config/index.ts',
  ],

  // Output format: ESM only (modern SvelteKit standard)
  format: ['esm'],

  // Generate TypeScript declaration files
  dts: {
    entry: [
      'src/lib/index.ts',
      'src/lib/server/index.ts',
      'src/lib/server/markdownRenderer.ts',
      'src/lib/server/screenshot-service.ts',
      'src/lib/plugins/index.ts',
      'src/lib/reference.ts',
      'src/lib/sveltekit/index.ts',
      'src/lib/utils/index.ts',
      'src/lib/utils/navigation-scanner.ts',
      'src/lib/utils/openapi-formatter.ts',
      'src/lib/config/index.ts',
    ],
  },

  // Enable code splitting for better tree-shaking
  splitting: true,

  // Generate sourcemaps for debugging
  sourcemap: true,

  // Clean dist/ before each build
  clean: true,

  // External dependencies (peer deps + runtime deps that should not be bundled)
  external: [
    'svelte',
    '@sveltejs/kit',
    '$app/environment',
    '$app/navigation',
    'mermaid',
    '@lucide/svelte',
    'playwright',
    // Also externalize our own runtime dependencies
    'shiki',
    'unist-util-visit',
    'yaml',
    // Server-only dependencies (should not be bundled)
    'ts-morph',
    'glob',
    'chokidar',
  ],

  // Post-build: copy styles and grammar data to dist.
  onSuccess: async () => {
    logger.info('Copying CSS and JSON files to dist');

    const srcLib = join(process.cwd(), 'src/lib');
    const distLib = join(process.cwd(), 'dist');

    // Copy .css files (modern CSS with native nesting)
    copyFiles(srcLib, distLib, /\.css$/);

    // Copy .json files (for grammars, etc.)
    copyFiles(srcLib, distLib, /\.json$/);

    logger.info('Non-TS files copied successfully');
  },
});
