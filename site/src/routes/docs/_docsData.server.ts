import { error } from '@sveltejs/kit';
import {
  createDocsLayoutLoad,
  createDocsPageLoad,
  createDocsSearchHandler,
  createSvelteKitDocs,
  type MarkdownModuleLoader,
} from '@goobits/docs-engine/sveltekit';

const modules = import.meta.glob('$docs-content/**/*.md', {
  import: 'default',
  query: '?raw',
}) as Record<string, MarkdownModuleLoader>;

export const docsSite = createSvelteKitDocs({
  modules,
  resolvePath: (modulePath) => modulePath.replace(/^\$docs-content\//, ''),
  config: {
    routePrefix: '/docs',
    screenshots: { enabled: false },
    features: { editOnGithub: true },
    git: {
      repoUrl: 'https://github.com/goobits/docs-engine',
      branch: 'main',
      docsPath: 'docs',
    },
  },
});

export const loadDocsLayout = createDocsLayoutLoad(docsSite);
export const loadDocsPage = createDocsPageLoad(docsSite, error);
export const getDocsSearch = createDocsSearchHandler(docsSite);
