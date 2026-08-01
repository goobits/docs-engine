import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import type { Html, Image, Link } from 'mdast';
import { readFileSync } from 'fs';
import { extname } from 'path';
import type { ExtractedLink } from './_linkModels.js';

// ============================================================================
// Module-Private Helpers (True Privacy via ESM)
// ============================================================================

/**
 * Check if a URL is external (http/https)
 * Module-private helper - not exported, not accessible outside this module
 */
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Check if a URL is an anchor-only link
 * Module-private helper - not exported, not accessible outside this module
 */
function isAnchorOnly(url: string): boolean {
  return url.startsWith('#');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Extract all links from a markdown file
 *
 * Extracts:
 * - Markdown links: `[text](url)`
 * - Images: `![alt](url)`
 * - HTML links: `<a href="url">`
 *
 * @param filePath - Path to markdown file
 * @returns Array of extracted links
 *
 * @example
 * ```typescript
 * const links = extractLinksFromFile('./docs/guide.md');
 * links.forEach(link => {
 *   console.log(`${link.file}:${link.line} - ${link.url}`);
 * });
 * ```
 *
 * @public
 */
export function extractLinksFromFile(filePath: string): ExtractedLink[] {
  const content = readFileSync(filePath, 'utf-8');
  const links: ExtractedLink[] = [];

  const parser = unified().use(remarkParse);
  if (extname(filePath).toLowerCase() === '.mdx') {
    parser.use(remarkMdx);
  }
  const tree = parser.parse(content);

  // Extract markdown links and images
  visit(tree, ['link', 'image'], (node, _index, _parent) => {
    const el = node as Link | Image;
    const url = el.url;
    if (!url) return;

    const position = el.position;
    const line = position?.start.line || 0;

    // Get link text
    let text = '';
    if (el.type === 'link') {
      const linkNode = el as Link;
      if (linkNode.children && linkNode.children.length > 0) {
        const firstChild = linkNode.children[0];
        if ('value' in firstChild) {
          text = firstChild.value as string;
        }
      }
    } else if (el.type === 'image') {
      const imageNode = el as Image;
      text = imageNode.alt || '';
    }

    links.push({
      url,
      text,
      file: filePath,
      line,
      type: el.type === 'image' ? 'image' : 'link',
      isExternal: isExternalUrl(url),
      isAnchor: isAnchorOnly(url),
    });
  });

  // Parse links only from real HTML nodes, excluding fenced code examples.
  visit(tree, 'html', (node) => {
    const htmlNode = node as Html;
    const htmlLinkRegex = /<a\s[^>]*?href=["']([^"']+)["']/gi;
    let match;
    while ((match = htmlLinkRegex.exec(htmlNode.value)) !== null) {
      const url = match[1];
      const precedingLines = htmlNode.value.slice(0, match.index).split('\n').length - 1;
      links.push({
        url,
        text: '',
        file: filePath,
        line: (htmlNode.position?.start.line ?? 0) + precedingLines,
        type: 'html',
        isExternal: isExternalUrl(url),
        isAnchor: isAnchorOnly(url),
      });
    }
  });

  // In MDX, JSX elements are distinct AST nodes rather than raw HTML nodes.
  visit(tree, (node) => {
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;

    const element = node as typeof node & {
      name?: string | null;
      attributes?: Array<{ type: string; name?: string; value?: unknown }>;
    };
    if (element.name !== 'a') return;

    const href = element.attributes?.find(
      (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'href'
    )?.value;
    if (typeof href !== 'string') return;

    links.push({
      url: href,
      text: '',
      file: filePath,
      line: element.position?.start.line ?? 0,
      type: 'html',
      isExternal: isExternalUrl(href),
      isAnchor: isAnchorOnly(href),
    });
  });

  return links;
}

/**
 * Extract links from multiple markdown files
 *
 * @param filePaths - Array of file paths
 * @returns Array of all extracted links
 *
 * @example
 * ```typescript
 * const files = ['./docs/guide.md', './docs/api.md'];
 * const allLinks = extractLinksFromFiles(files);
 * console.log(`Found ${allLinks.length} links across ${files.length} files`);
 * ```
 *
 * @public
 */
export function extractLinksFromFiles(filePaths: string[]): ExtractedLink[] {
  const allLinks: ExtractedLink[] = [];

  for (const file of filePaths) {
    try {
      const links = extractLinksFromFile(file);
      allLinks.push(...links);
    } catch (error) {
      console.error(`Error extracting links from ${file}:`, error);
    }
  }

  return allLinks;
}

/**
 * Group links by type (internal, external, anchor)
 *
 * @param links - Array of links to group
 * @returns Grouped links object
 *
 * @example
 * ```typescript
 * const grouped = groupLinksByType(links);
 * console.log(`Internal: ${grouped.internal.length}`);
 * console.log(`External: ${grouped.external.length}`);
 * console.log(`Anchors: ${grouped.anchor.length}`);
 * ```
 *
 * @public
 */
export function groupLinksByType(links: ExtractedLink[]): {
  internal: ExtractedLink[];
  external: ExtractedLink[];
  anchor: ExtractedLink[];
} {
  return {
    internal: links.filter((l) => !l.isExternal && !l.isAnchor),
    external: links.filter((l) => l.isExternal),
    anchor: links.filter((l) => l.isAnchor),
  };
}
