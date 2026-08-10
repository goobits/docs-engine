import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import path from 'node:path';
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
} from '@goobits/docs-engine/plugins';
import { prepareSvelteKitBuildDirectory } from '@goobits/docs-engine/build-storage';

const siteRoot = import.meta.dirname;
const workspaceRoot = path.resolve(siteRoot, '..');

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
    ...(process.env.NODE_ENV === 'production'
      ? { outDir: prepareSvelteKitBuildDirectory(siteRoot, [siteRoot, workspaceRoot]) }
      : {}),
  },
};

export default config;
