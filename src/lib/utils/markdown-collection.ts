import { buildNavigation, type DocFile } from './navigation-builder.ts';
import type { DocsSection } from './navigation.ts';
import { parseFrontmatter } from './frontmatter.ts';
import { createSearchIndex } from './search-index.ts';

export interface MarkdownCollectionEntry extends DocFile {
  slug: string;
}

export interface MarkdownNavigationData {
  navigation: DocsSection[];
  searchIndex: string;
}

export interface MarkdownCollection {
  getBySlug(slug: string): MarkdownCollectionEntry | null;
  getFiles(): DocFile[];
  getNavigationData(): MarkdownNavigationData;
}

export interface MarkdownCollectionOptions {
  basePath?: string;
  resolvePath?: (modulePath: string) => string | null;
}

export function createMarkdownCollection(
  modules: Record<string, string>,
  options: MarkdownCollectionOptions = {}
): MarkdownCollection {
  const basePath = normalizeBasePath(options.basePath ?? '/docs');
  const entries = Object.entries(modules)
    .map(([modulePath, content]) => createEntry(modulePath, content, basePath, options.resolvePath))
    .filter((entry): entry is MarkdownCollectionEntry => entry !== null)
    .sort((left, right) => left.path.localeCompare(right.path));

  const entriesBySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const files = entries.map(({ path, content, href }) => ({ path, content, href }));

  return {
    getBySlug(slug): MarkdownCollectionEntry | null {
      return entriesBySlug.get(normalizeSlug(slug)) ?? null;
    },
    getFiles(): DocFile[] {
      return files;
    },
    getNavigationData(): MarkdownNavigationData {
      const navigation = serializeNavigation(buildNavigation(files, { basePath }));
      const contentMap = new Map(
        files.map((file) => [file.href, parseFrontmatter(file.content).content])
      );

      return {
        navigation,
        searchIndex: createSearchIndex(navigation, contentMap),
      };
    },
  };
}

function serializeNavigation(navigation: DocsSection[]): DocsSection[] {
  return navigation.map(({ icon: _icon, ...section }) => section);
}

function createEntry(
  modulePath: string,
  content: string,
  basePath: string,
  resolvePath: MarkdownCollectionOptions['resolvePath']
): MarkdownCollectionEntry | null {
  const path = resolvePath?.(modulePath) ?? modulePath.split('/content/').at(-1) ?? null;
  if (!path || !path.endsWith('.md')) return null;

  const slug = path.replace(/\.md$/, '');

  return {
    path,
    content,
    slug,
    href: slug === 'index' ? basePath : `${basePath}/${slug}`,
  };
}

function normalizeBasePath(path: string): string {
  const withoutTrailingSlash = path.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+/, '').replace(/\.md$/, '') || 'index';
}
