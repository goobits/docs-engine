import {
  buildNavigationFromMetadata,
  type DocFile,
  type DocNavigationMetadata,
} from './navigation-builder.ts';
import type { DocsSection } from './navigation.ts';
import { parseFrontmatter } from './frontmatter.ts';
import { createSearchIndex } from './search-index.ts';

export interface MarkdownCollectionEntry extends DocFile {
  slug: string;
}

export interface MarkdownNavigationData {
  navigation: DocsSection[];
}

export interface MarkdownCollection {
  getBySlug(slug: string): Promise<MarkdownCollectionEntry | null>;
  getFiles(): Promise<DocFile[]>;
  getNavigationData(): MarkdownNavigationData;
  getSearchIndex(): Promise<string>;
}

export interface MarkdownCollectionOptions {
  navigationMetadata: Record<string, DocNavigationMetadata>;
  basePath?: string;
  resolvePath?: (modulePath: string) => string | null;
}

export type MarkdownContentLoader = () => Promise<string>;

type LazyMarkdownCollectionEntry = Omit<MarkdownCollectionEntry, 'content'> & {
  metadata: DocNavigationMetadata;
  loadContent: MarkdownContentLoader;
};

export function createMarkdownCollection(
  modules: Record<string, MarkdownContentLoader>,
  options: MarkdownCollectionOptions
): MarkdownCollection {
  const basePath = normalizeBasePath(options.basePath ?? '/docs');
  const entries = Object.entries(modules)
    .map(([modulePath, loadContent]) =>
      createEntry(
        modulePath,
        loadContent,
        options.navigationMetadata,
        basePath,
        options.resolvePath
      )
    )
    .filter((entry): entry is LazyMarkdownCollectionEntry => entry !== null)
    .sort((left, right) => left.path.localeCompare(right.path));

  const entriesBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const navigation = buildNavigationFromMetadata(
    entries.map(({ path, href, metadata }) => ({ path, href, metadata })),
    { basePath }
  );
  let searchIndexPromise: Promise<string> | null = null;

  return {
    async getBySlug(slug): Promise<MarkdownCollectionEntry | null> {
      const entry = entriesBySlug.get(normalizeSlug(slug));
      return entry ? materializeEntry(entry) : null;
    },
    async getFiles(): Promise<DocFile[]> {
      return Promise.all(entries.map(materializeFile));
    },
    getNavigationData(): MarkdownNavigationData {
      return { navigation };
    },
    getSearchIndex(): Promise<string> {
      if (!searchIndexPromise) {
        const request = Promise.all(entries.map(materializeFile)).then((files) => {
          const contentMap = new Map(
            files.map((file) => [file.href, parseFrontmatter(file.content).content])
          );
          return createSearchIndex(navigation, contentMap);
        });
        searchIndexPromise = request;
        void request.catch(() => {
          if (searchIndexPromise === request) searchIndexPromise = null;
        });
      }
      return searchIndexPromise;
    },
  };
}

function createEntry(
  modulePath: string,
  loadContent: MarkdownContentLoader,
  navigationMetadata: Record<string, DocNavigationMetadata>,
  basePath: string,
  resolvePath: MarkdownCollectionOptions['resolvePath']
): LazyMarkdownCollectionEntry | null {
  const path = resolvePath?.(modulePath) ?? modulePath.split('/content/').at(-1) ?? null;
  if (!path || !path.endsWith('.md')) return null;

  const metadata = navigationMetadata[modulePath];
  if (metadata === undefined) {
    throw new Error(`Missing navigation metadata for ${modulePath}`);
  }

  const slug = path.replace(/\.md$/, '');
  let contentPromise: Promise<string> | null = null;

  return {
    path,
    slug,
    href: slug === 'index' ? basePath : `${basePath}/${slug}`,
    metadata,
    async loadContent(): Promise<string> {
      contentPromise ??= loadContent().then((content) => {
        if (typeof content !== 'string') {
          throw new TypeError(`Markdown loader for ${modulePath} did not return a string`);
        }
        return content;
      });
      const request = contentPromise;
      try {
        return await request;
      } catch (error) {
        if (contentPromise === request) contentPromise = null;
        throw error;
      }
    },
  };
}

async function materializeEntry(
  entry: LazyMarkdownCollectionEntry
): Promise<MarkdownCollectionEntry> {
  return {
    path: entry.path,
    href: entry.href,
    slug: entry.slug,
    content: await entry.loadContent(),
  };
}

async function materializeFile(entry: LazyMarkdownCollectionEntry): Promise<DocFile> {
  return {
    path: entry.path,
    href: entry.href,
    content: await entry.loadContent(),
  };
}

function normalizeBasePath(path: string): string {
  const withoutTrailingSlash = path.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+/, '').replace(/\.md$/, '') || 'index';
}
