import { parse as parseYaml } from 'yaml';
import { isDocsAudience, type DocsSection, type DocsLink } from './navigation.ts';
import { createBrowserLogger } from './browser-logger.ts';

const logger = createBrowserLogger('navigation-builder');

/**
 * Frontmatter metadata extracted from markdown files
 */
export interface DocFrontmatter {
  title?: string;
  description?: string;
  order?: number;
  section?: string;
  icon?: string;
  hidden?: boolean;
  audience?: string;
}

/**
 * Document file with path and content
 */
export interface DocFile {
  /** Relative path from docs root (e.g., "quick-start.md" or "dsl/fundamentals.md") */
  path: string;
  /** Full markdown content including frontmatter */
  content: string;
  /** URL href (e.g., "/docs/quick-start") */
  href: string;
}

/** Compact navigation metadata that can cross a build boundary without the markdown body. */
export interface DocNavigationMetadata extends DocFrontmatter {
  description: string;
}

/** Path and href paired with pre-extracted navigation metadata. */
export interface DocNavigationEntry {
  path: string;
  href: string;
  metadata: DocNavigationMetadata;
}

/**
 * Options for building navigation tree
 */
export interface NavigationBuilderOptions {
  /** Base URL path (default: "/docs") */
  basePath?: string;
  /** Default section name for ungrouped docs */
  defaultSection?: string;
  /** Default section description */
  defaultSectionDescription?: string;
}

/**
 * Extract frontmatter from markdown content
 */
export function extractFrontmatter(content: string): {
  frontmatter: DocFrontmatter;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      body: content,
    };
  }

  try {
    const frontmatter = parseYaml(match[1]) as DocFrontmatter;
    const body = match[2];
    return { frontmatter, body };
  } catch (err) {
    logger.warn({ error: err }, 'Failed to parse frontmatter');
    return {
      frontmatter: {},
      body: content,
    };
  }
}

/**
 * Generate title from file path if not provided in frontmatter
 */
function generateTitleFromPath(path: string): string {
  // Remove .md extension and get filename
  const filename = path.replace(/\.md$/, '').split('/').pop() || '';

  // Convert kebab-case or snake_case to Title Case
  return filename
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract first paragraph from markdown body as description
 */
function extractDescriptionFromBody(body: string): string {
  // Remove headings
  const withoutHeadings = body.replace(/^#+\s+.+$/gm, '');

  // Get first paragraph
  const firstParagraph = withoutHeadings.trim().split('\n\n')[0]?.replace(/\n/g, ' ').trim();

  // Truncate if too long
  if (!firstParagraph) return '';
  return firstParagraph.length > 150 ? firstParagraph.substring(0, 147) + '...' : firstParagraph;
}

/** Extract only the data required to build navigation, omitting the markdown body. */
export function extractNavigationMetadata(content: string): DocNavigationMetadata {
  const { frontmatter, body } = extractFrontmatter(content);
  return {
    ...frontmatter,
    description: frontmatter.description || extractDescriptionFromBody(body),
  };
}

/**
 * Build navigation tree from document files
 *
 * This function processes an array of document files with frontmatter
 * and builds a structured navigation tree suitable for DocsSidebar.
 *
 * @param files - Array of document files with path, content, and href
 * @param options - Configuration options
 * @returns Array of documentation sections
 *
 * A section takes its icon from the `icon` frontmatter of its lowest-order page.
 * Icons are carried as names rather than components so the result stays
 * JSON-serializable across a SvelteKit server load.
 *
 * @example
 * ```typescript
 * import { buildNavigation } from '@goobits/docs-engine/utils';
 *
 * const files = [
 *   {
 *     path: 'quick-start.md',
 *     content: '---\ntitle: Quick Start\nsection: Getting Started\nicon: rocket\n---\n...',
 *     href: '/docs/quick-start'
 *   }
 * ];
 *
 * const navigation = buildNavigation(files);
 * ```
 */
export function buildNavigation(
  files: DocFile[],
  options: NavigationBuilderOptions = {}
): DocsSection[] {
  return buildNavigationFromMetadata(
    files.map((file) => ({
      path: file.path,
      href: file.href,
      metadata: extractNavigationMetadata(file.content),
    })),
    options
  );
}

/** Build navigation from compact metadata without retaining or loading markdown bodies. */
export function buildNavigationFromMetadata(
  entries: DocNavigationEntry[],
  options: NavigationBuilderOptions = {}
): DocsSection[] {
  const { defaultSection = 'Documentation', defaultSectionDescription = 'Documentation pages' } =
    options;

  const docs = entries
    .map((entry) => {
      const { metadata } = entry;

      // Skip hidden files
      if (metadata.hidden) return null;

      const title = metadata.title || generateTitleFromPath(entry.path);
      const section = metadata.section || defaultSection;
      const order = metadata.order ?? 999; // Default to end if no order
      const audience = isDocsAudience(metadata.audience) ? metadata.audience : undefined;

      return {
        title,
        description: metadata.description,
        section,
        order,
        href: entry.href,
        audience,
        iconName: metadata.icon,
      };
    })
    .filter((doc): doc is NonNullable<typeof doc> => doc !== null);

  // Group by section
  const sectionMap = new Map<string, DocsLink[]>();
  // A section takes its icon from the lowest-order page that declares one.
  const sectionIcons = new Map<string, { order: number; iconName: string }>();

  for (const doc of docs) {
    if (!sectionMap.has(doc.section)) {
      sectionMap.set(doc.section, []);
    }

    sectionMap.get(doc.section)?.push({
      title: doc.title,
      description: doc.description,
      href: doc.href,
      audience: doc.audience,
    });

    if (doc.iconName) {
      const claimed = sectionIcons.get(doc.section);
      if (!claimed || doc.order < claimed.order) {
        sectionIcons.set(doc.section, { order: doc.order, iconName: doc.iconName });
      }
    }
  }

  // Pre-compute order map for O(1) lookup (avoids O(n²) complexity)
  const orderMap = new Map(docs.map((d) => [d.href, d.order ?? 999]));

  // Build DocsSection array
  const sections: DocsSection[] = [];

  for (const [sectionTitle, links] of sectionMap.entries()) {
    // Sort links by order (from frontmatter) - now O(n log n) instead of O(n²)
    const sortedLinks = links.sort((a, b) => {
      const orderA = orderMap.get(a.href) ?? 999;
      const orderB = orderMap.get(b.href) ?? 999;
      return orderA - orderB;
    });

    sections.push({
      title: sectionTitle,
      description:
        sectionTitle === defaultSection
          ? defaultSectionDescription
          : `${sectionTitle} documentation`,
      iconName: sectionIcons.get(sectionTitle)?.iconName,
      links: sortedLinks,
    });
  }

  // Sort sections by the minimum order of their links - now O(n log n) instead of O(n²)
  sections.sort((a, b) => {
    const minOrderA = Math.min(...a.links.map((link) => orderMap.get(link.href) ?? 999));
    const minOrderB = Math.min(...b.links.map((link) => orderMap.get(link.href) ?? 999));
    return minOrderA - minOrderB;
  });

  return sections;
}

/**
 * Utility to create DocFile objects from filesystem
 * Call this from your SvelteKit server code, not from docs-engine
 *
 * @example
 * ```typescript
 * // In your +layout.server.ts or similar
 * import { readdirSync, readFileSync } from 'fs';
 * import { createDocFile } from '@goobits/docs-engine/utils';
 *
 * const files = readdirSync('/workspace/docs')
 *   .filter(name => name.endsWith('.md'))
 *   .map(name => createDocFile({
 *     path: name,
 *     content: readFileSync(`/workspace/docs/${name}`, 'utf-8'),
 *     basePath: '/docs'
 *   }));
 * ```
 */
export function createDocFile(params: {
  path: string;
  content: string;
  basePath?: string;
}): DocFile {
  const { path, content, basePath = '/docs' } = params;

  // Convert file path to URL href
  // Examples:
  //   "quick-start.md" -> "/docs/quick-start"
  //   "dsl/fundamentals.md" -> "/docs/dsl/fundamentals"
  const href = `${basePath}/${path.replace(/\.md$/, '')}`;

  return { path, content, href };
}
