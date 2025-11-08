import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import {
  calloutsPlugin,
  mermaidPlugin,
  filetreePlugin,
  tabsPlugin,
  codeHighlightPlugin,
  remarkTableOfContents,
  linksPlugin,
  collapsePlugin,
  referencePlugin,
} from 'dist/plugins/index.js';

/** @type {import("@sveltejs/kit").Config} */
const config = {
  extensions: ['.svelte', '.md', '.svx'],

  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.md', '.svx'],
      remarkPlugins: [
        filetreePlugin(),
        calloutsPlugin(),
        mermaidPlugin(),
        tabsPlugin(),
        remarkTableOfContents,
        linksPlugin,
        collapsePlugin(),
        referencePlugin,
        codeHighlightPlugin({ theme: 'dracula' }),
      ],
    }),
  ],

  kit: {
    adapter: adapter(),
  },
};

export default config;
