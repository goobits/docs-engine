import { error } from '@sveltejs/kit';
import {
  createSvelteKitDocsRouteHandlers,
  type MarkdownModuleLoader,
} from '@goobits/docs-engine/sveltekit';

const modules = import.meta.glob('$docs-content/**/*.md', {
  import: 'default',
  query: '?raw',
}) as Record<string, MarkdownModuleLoader>;

export const { docsSite, loadDocsLayout, loadDocsPage, getDocsSearch } =
  createSvelteKitDocsRouteHandlers(
    {
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
    },
    error
  );
