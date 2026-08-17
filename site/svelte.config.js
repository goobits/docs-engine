import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { prepareSvelteKitBuildDirectory } from '@goobits/docs-engine/build-storage';
import path from 'node:path';

const siteRoot = import.meta.dirname;
const workspaceRoot = path.resolve(siteRoot, '..');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    ...(process.env.NODE_ENV === 'production'
      ? { outDir: prepareSvelteKitBuildDirectory(siteRoot, [siteRoot, workspaceRoot]) }
      : {}),
  },
};

export default config;
