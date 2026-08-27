import {
  createMarkdownDocs,
  type MarkdownDocsConfig,
  type MarkdownDocsOptions,
} from '../config/index.ts';
import type { ReferencePluginOptions } from '../plugins/reference.ts';
import { renderDocsMarkdown } from '../server/markdownRenderer.ts';
import { extractTitle, parseFrontmatter, type Frontmatter } from '../utils/frontmatter.ts';
import { buildNavigation, type DocFile } from '../utils/navigation-builder.ts';
import type { DocsSection } from '../utils/navigation.ts';
import { createSearchIndex } from '../utils/search-index.ts';

export type MarkdownModuleLoader = () => Promise<string | { default: string }>;

export interface SvelteKitDocsOptions {
  modules: Record<string, MarkdownModuleLoader>;
  config?: MarkdownDocsOptions;
  resolvePath?: (modulePath: string) => string | null;
  references?: ReferencePluginOptions;
  searchIndexUrl?: string;
}

export interface SvelteKitDocsPage {
  content: string;
  title: string;
  description?: string;
  slug: string;
  path: string;
  href: string;
  frontmatter: Frontmatter;
  editLink?: {
    href: string;
    text: string;
  };
}

export interface SvelteKitDocsLayoutData {
  navigation: DocsSection[];
  searchIndexUrl?: string;
}

export interface SvelteKitDocs {
  config: MarkdownDocsConfig;
  getPage(slug: string): Promise<SvelteKitDocsPage | null>;
  getNavigation(): Promise<DocsSection[]>;
  getSearchIndex(): Promise<string>;
  getLayoutData(): Promise<SvelteKitDocsLayoutData>;
}

export interface SvelteKitDocsRouteHandlers {
  docsSite: SvelteKitDocs;
  loadDocsLayout: ReturnType<typeof createDocsLayoutLoad>;
  loadDocsPage: ReturnType<typeof createDocsPageLoad>;
  getDocsSearch: ReturnType<typeof createDocsSearchHandler>;
}

export type SvelteKitHttpError = (status: 404, message: string) => never;

interface DocsEntry {
  path: string;
  slug: string;
  href: string;
  load: MarkdownModuleLoader;
}

/** Create the shared page, navigation, search, and rendering runtime for a SvelteKit docs site. */
export function createSvelteKitDocs(options: SvelteKitDocsOptions): SvelteKitDocs {
  const config = createMarkdownDocs(options.config);
  const basePath = normalizeBasePath(config.routePrefix);
  const entries = Object.entries(options.modules)
    .map(([modulePath, load]) => createEntry(modulePath, load, basePath, options.resolvePath))
    .filter((entry): entry is DocsEntry => entry !== null)
    .sort((left, right) => left.path.localeCompare(right.path));
  const entriesBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const contentPromises = new Map<string, Promise<string>>();
  let filesPromise: Promise<DocFile[]> | null = null;
  let navigationPromise: Promise<DocsSection[]> | null = null;
  let searchIndexPromise: Promise<string> | null = null;

  const loadContent = (entry: DocsEntry): Promise<string> => {
    let request = contentPromises.get(entry.slug);
    if (!request) {
      request = entry.load().then((module) => {
        const content = typeof module === 'string' ? module : module.default;
        if (typeof content !== 'string') {
          throw new TypeError(`Markdown loader for ${entry.path} did not return a string`);
        }
        return content;
      });
      contentPromises.set(entry.slug, request);
      void request.catch(() => {
        if (contentPromises.get(entry.slug) === request) contentPromises.delete(entry.slug);
      });
    }
    return request;
  };

  const getFiles = (): Promise<DocFile[]> => {
    if (!filesPromise) {
      const request = Promise.all(
        entries.map(async (entry) => ({
          path: entry.path,
          href: entry.href,
          content: await loadContent(entry),
        }))
      );
      filesPromise = request;
      void request.catch(() => {
        if (filesPromise === request) filesPromise = null;
      });
    }
    return filesPromise;
  };

  const getNavigation = (): Promise<DocsSection[]> => {
    if (!navigationPromise) {
      const request = getFiles().then((files) => buildNavigation(files, { basePath }));
      navigationPromise = request;
      void request.catch(() => {
        if (navigationPromise === request) navigationPromise = null;
      });
    }
    return navigationPromise;
  };

  const getSearchIndex = (): Promise<string> => {
    if (!searchIndexPromise) {
      const request = Promise.all([getFiles(), getNavigation()]).then(([files, navigation]) =>
        createSearchIndex(
          navigation,
          new Map(files.map((file) => [file.href, parseFrontmatter(file.content).content]))
        )
      );
      searchIndexPromise = request;
      void request.catch(() => {
        if (searchIndexPromise === request) searchIndexPromise = null;
      });
    }
    return searchIndexPromise;
  };

  return {
    config,
    async getPage(slug): Promise<SvelteKitDocsPage | null> {
      const normalizedSlug = normalizeSlug(slug);
      const entry = entriesBySlug.get(normalizedSlug);
      if (!entry) return null;

      const raw = await loadContent(entry);
      const { frontmatter, content: markdown } = parseFrontmatter(raw);
      const title = extractTitle(frontmatter, markdown, titleFromSlug(normalizedSlug));
      const content = await renderDocsMarkdown(markdown, {
        sourcePath: entry.path,
        gfm: config.markdown.gfm,
        tableOfContents: config.markdown.tableOfContents,
        theme: config.markdown.theme,
        screenshots: config.screenshots.enabled
          ? { basePath: config.screenshots.basePath, version: config.screenshots.version }
          : false,
        references: options.references,
      });

      return {
        content,
        title,
        description:
          typeof frontmatter.description === 'string' ? frontmatter.description : undefined,
        slug: normalizedSlug,
        path: entry.path,
        href: entry.href,
        frontmatter,
        editLink: createEditLink(config, entry.path),
      };
    },
    getNavigation,
    getSearchIndex,
    async getLayoutData(): Promise<SvelteKitDocsLayoutData> {
      return {
        navigation: await getNavigation(),
        searchIndexUrl: config.features.search
          ? (options.searchIndexUrl ?? `${basePath}/search-index.json`)
          : undefined,
      };
    },
  };
}

/** Create the small SvelteKit layout loader shared by docs routes. */
export function createDocsLayoutLoad(docs: SvelteKitDocs) {
  return (): Promise<SvelteKitDocsLayoutData> => docs.getLayoutData();
}

/** Create a SvelteKit page loader for both the docs index and catch-all route. */
export function createDocsPageLoad(
  docs: SvelteKitDocs,
  httpError: SvelteKitHttpError,
  defaultSlug = 'index'
) {
  return async ({
    params,
  }: {
    params: Record<string, string | undefined>;
  }): Promise<SvelteKitDocsPage> => {
    const slug = params.slug ?? defaultSlug;
    const page = await docs.getPage(slug);
    if (!page) httpError(404, `Documentation page not found: ${slug}`);
    return page;
  };
}

/** Create the serializable search-index endpoint used by SearchModal. */
export function createDocsSearchHandler(docs: SvelteKitDocs) {
  return async (): Promise<Response> =>
    new Response(await docs.getSearchIndex(), {
      headers: {
        'cache-control': 'public, max-age=300',
        'content-type': 'application/json; charset=utf-8',
      },
    });
}

/** Compose the complete route module shared by SvelteKit documentation hosts. */
export function createSvelteKitDocsRouteHandlers(
  options: SvelteKitDocsOptions,
  httpError: SvelteKitHttpError
): SvelteKitDocsRouteHandlers {
  const docsSite = createSvelteKitDocs(options);
  return {
    docsSite,
    loadDocsLayout: createDocsLayoutLoad(docsSite),
    loadDocsPage: createDocsPageLoad(docsSite, httpError),
    getDocsSearch: createDocsSearchHandler(docsSite),
  };
}

function createEntry(
  modulePath: string,
  load: MarkdownModuleLoader,
  basePath: string,
  resolvePath: SvelteKitDocsOptions['resolvePath']
): DocsEntry | null {
  const path = resolvePath?.(modulePath) ?? defaultResolvePath(modulePath);
  if (!path?.endsWith('.md')) return null;
  const slug = path.replace(/\.md$/, '');
  return {
    path,
    slug,
    href: slug === 'index' ? basePath : `${basePath}/${slug}`,
    load,
  };
}

function defaultResolvePath(modulePath: string): string | null {
  for (const marker of ['/content/', '/docs/']) {
    const index = modulePath.lastIndexOf(marker);
    if (index !== -1) return modulePath.slice(index + marker.length);
  }
  const normalized = modulePath.replace(/^\.\//, '').replace(/^\/+/, '');
  return normalized.endsWith('.md') ? normalized : null;
}

function normalizeBasePath(path: string): string {
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return normalized || '/docs';
}

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+/, '').replace(/\.md$/, '') || 'index';
}

function titleFromSlug(slug: string): string {
  const name = slug.split('/').at(-1) || 'Documentation';
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createEditLink(config: MarkdownDocsConfig, path: string): SvelteKitDocsPage['editLink'] {
  if (!config.features.editOnGithub || !config.git) return undefined;
  const repoUrl = config.git.repoUrl.replace(/\/$/, '');
  const branch = config.git.branch ?? 'main';
  const docsPath = config.git.docsPath?.replace(/^\/+|\/+$/g, '') ?? 'docs';
  return {
    href: `${repoUrl}/edit/${branch}/${docsPath}/${path}`,
    text: config.git.editLinkText ?? 'Edit this page',
  };
}
