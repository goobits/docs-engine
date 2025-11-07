import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import {
  codeHighlightPlugin,
  linksPlugin,
  remarkTableOfContents,
  calloutsPlugin,
  filetreePlugin,
  tabsPlugin,
  mermaidPlugin,
  collapsePlugin,
  referencePlugin,
  imageOptimizationPlugin,
  screenshotPlugin,
} from '../dist/plugins/index.js';

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
        // Content processing
        linksPlugin,
        remarkTableOfContents,

        // Code highlighting (with Svelte 5 compatibility)
        [codeHighlightPlugin, { theme: 'dracula' }],

        // Markdown enhancements
        calloutsPlugin,
        filetreePlugin,
        tabsPlugin,
        mermaidPlugin,
        collapsePlugin,

        // Advanced features
        referencePlugin,
        imageOptimizationPlugin,
        screenshotPlugin,

        // Math support disabled due to Svelte 5 parser issues with LaTeX backslashes
        // remarkMathParser,
        // katexPlugin,
      ],
    }),
  ],

  kit: {
    adapter: adapter(),
  },
};

export default config;
