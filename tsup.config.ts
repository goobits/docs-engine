import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { preprocess } from 'svelte/compiler';
import { sveltePreprocess } from 'svelte-preprocess';
import { createLogger } from './src/lib/utils/logger.js';

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
      mkdirSync(destPath, { recursive: true });
      copyFiles(srcPath, destPath, pattern);
    } else if (pattern.test(item)) {
      mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
      logger.debug({ file: relative(process.cwd(), destPath) }, 'Copied file');
    }
  }
}

/**
 * Recursively preprocess and copy .svelte files from src to dist.
 *
 * Components are authored with `<script lang="ts">`, but consumers should not
 * have to preprocess TypeScript inside a dependency's Svelte files (modern
 * Vite/Svelte toolchains no longer do this). We strip the TypeScript here so
 * the shipped components contain plain-JS `<script>` blocks that compile
 * anywhere — the same thing `svelte-package` does.
 */
async function preprocessSvelteFiles(srcDir: string, destDir: string): Promise<void> {
  const items = readdirSync(srcDir);

  for (const item of items) {
    const srcPath = join(srcDir, item);
    const destPath = join(destDir, item);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      await preprocessSvelteFiles(srcPath, destPath);
    } else if (/\.svelte$/.test(item)) {
      const source = readFileSync(srcPath, 'utf-8');
      const { code } = await preprocess(source, sveltePreprocess(), { filename: srcPath });
      // Drop the now-redundant `lang="ts"` so the Svelte compiler treats the
      // already-transpiled script as plain JS with no preprocessor required.
      const jsCode = code.replace(/(<script[^>]*?)\s+lang=(["'])(?:ts|typescript)\2/g, '$1');
      mkdirSync(dirname(destPath), { recursive: true });
      writeFileSync(destPath, jsCode);
      logger.debug({ file: relative(process.cwd(), destPath) }, 'Preprocessed svelte file');
    }
  }
}

export default defineConfig({
  // Entry points for all public APIs
  entry: [
    'src/lib/index.ts',
    'src/lib/server/index.ts',
    'src/lib/server/screenshot-service.ts',
    'src/lib/plugins/index.ts',
    'src/lib/components/index.ts',
    'src/lib/utils/index.ts',
    'src/lib/config/index.ts',
  ],

  // Output format: ESM only (modern SvelteKit standard)
  format: ['esm'],

  // Generate TypeScript declaration files
  // Note: components/index.ts is excluded from DTS generation as it exports
  // Svelte components (.svelte files) which are handled separately by SvelteKit
  dts: {
    entry: [
      'src/lib/index.ts',
      'src/lib/server/index.ts',
      'src/lib/server/screenshot-service.ts',
      'src/lib/plugins/index.ts',
      'src/lib/utils/index.ts',
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

  // esbuild options
  esbuildOptions(options) {
    // Mark .svelte files as external so they're not processed
    options.external = [...(options.external || []), '*.svelte'];
  },

  // Post-build: Preprocess .svelte files and copy .css/.json files to dist/
  onSuccess: async () => {
    logger.info('Preprocessing .svelte files and copying .css/.json files to dist/');

    const srcLib = join(process.cwd(), 'src/lib');
    const distLib = join(process.cwd(), 'dist');

    // Preprocess .svelte files (strip TypeScript so consumers don't have to)
    await preprocessSvelteFiles(srcLib, distLib);

    // Copy .css files (modern CSS with native nesting)
    copyFiles(srcLib, distLib, /\.css$/);

    // Copy .json files (for grammars, etc.)
    copyFiles(srcLib, distLib, /\.json$/);

    logger.info('Non-TS files copied successfully');
  },
});
