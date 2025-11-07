import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { codeHighlightPlugin } from '../dist/plugins/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import("@sveltejs/kit").Config} */
const config = {
  extensions: ['.svelte', '.md'],

  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md'],
      layout: {
        _: resolve(__dirname, './src/lib/layouts/MarkdownLayout.svelte'),
      },
      remarkPlugins: [[codeHighlightPlugin, { theme: 'dracula' }]],
    }),
  ],

  kit: {
    adapter: adapter(),
  },
};

export default config;
