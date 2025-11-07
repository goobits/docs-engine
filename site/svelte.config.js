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
      remarkPlugins: [
        // Temporarily testing with minimal plugins to isolate crash
        codeHighlightPlugin({ theme: 'dracula' }),

        // Content processing
        // linksPlugin,
        // remarkTableOfContents,

        // Math support disabled due to Svelte 5 parser issues with LaTeX backslashes
        // remarkMathParser,
        // katexPlugin,

        // Markdown enhancements
        // calloutsPlugin,
        // filetreePlugin,
        // tabsPlugin,
        // mermaidPlugin,
        // collapsePlugin,

        // Advanced features
        // referencePlugin,
        // imageOptimizationPlugin,
        // screenshotPlugin,
      ],
    }),
  ],

  kit: {
    adapter: adapter(),
  },
};

export default config;
