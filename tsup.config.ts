import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';

/**
 * Recursively copy files matching a pattern from src to dist
 */
function copyFiles(srcDir: string, destDir: string, pattern: RegExp) {
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
			console.log(`Copied: ${relative(process.cwd(), destPath)}`);
		}
	}
}

export default defineConfig({
	// Entry points for all public APIs
	entry: [
		'src/lib/index.ts',
		'src/lib/server/index.ts',
		'src/lib/plugins/index.ts',
		'src/lib/components/index.ts',
		'src/lib/utils/index.ts',
		'src/lib/config/index.ts',
	],

	// Output format: ESM only (modern SvelteKit standard)
	format: ['esm'],

	// Generate TypeScript declaration files
	dts: false, // TODO: Fix plugin type signatures

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
		'mermaid',
		'@lucide/svelte',
		'playwright',
		// Also externalize our own runtime dependencies
		'marked',
		'shiki',
		'unist-util-visit',
		'yaml',
	],

	// esbuild options
	esbuildOptions(options) {
		// Mark .svelte files as external so they're not processed
		options.external = [...(options.external || []), '*.svelte'];
	},

	// Post-build: Copy .svelte and .scss files to dist/
	onSuccess: async () => {
		console.log('\nCopying .svelte and .scss files to dist/...');

		const srcLib = join(process.cwd(), 'src/lib');
		const distLib = join(process.cwd(), 'dist');

		// Copy .svelte files
		copyFiles(srcLib, distLib, /\.svelte$/);

		// Copy .scss files
		copyFiles(srcLib, distLib, /\.scss$/);

		console.log('Non-TS files copied successfully!\n');
	},
});
