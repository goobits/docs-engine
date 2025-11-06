import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import type { Root, Link, Image } from 'mdast';
import { readFileSync } from 'fs';

/**
 * Represents a link found in a markdown file
 *
 * @public
 */
export interface ExtractedLink {
  /** Link URL or path */
  url: string;
  /** Link text or alt text */
  text: string;
  /** Source file path */
  file: string;
  /** Line number in source file */
  line: number;
  /** Link type */
  type: 'link' | 'image' | 'html';
  /** Whether this is an external URL */
  isExternal: boolean;
  /** Whether this is an anchor link */
  isAnchor: boolean;
}

/**
 * Check if a URL is external (http/https)
 *
 * @param url - URL to check
 * @returns True if URL is external
 *
 * @example
 * ```typescript
 * isExternalUrl('https://example.com'); // true
 * isExternalUrl('/docs/guide'); // false
 * isExternalUrl('../README.md'); // false
 * ```
 *
 * @internal
 */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Check if a URL is an anchor-only link
 *
 * @param url - URL to check
 * @returns True if URL is just an anchor
 *
 * @example
 * ```typescript
 * isAnchorOnly('#section'); // true
 * isAnchorOnly('/docs/guide#section'); // false
 * ```
 *
 * @internal
 */
export function isAnchorOnly(url: string): boolean {
  return url.startsWith('#');
}

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

  // Parse markdown with MDX support
  const tree = unified().use(remarkParse).use(remarkMdx).parse(content);

  // Extract markdown links and images
  visit(tree, ['link', 'image'], (node: Link | Image, _index, parent) => {
    const url = node.url;
    if (!url) return;

    const position = node.position;
    const line = position?.start.line || 0;

    // Get link text
    let text = '';
    if (node.type === 'link') {
      const linkNode = node as Link;
      if (linkNode.children && linkNode.children.length > 0) {
        const firstChild = linkNode.children[0];
        if ('value' in firstChild) {
          text = firstChild.value as string;
        }
      }
    } else if (node.type === 'image') {
      const imageNode = node as Image;
      text = imageNode.alt || '';
    }

    links.push({
      url,
      text,
      file: filePath,
      line,
      type: node.type === 'image' ? 'image' : 'link',
      isExternal: isExternalUrl(url),
      isAnchor: isAnchorOnly(url),
    });
  });

  // Extract HTML links (basic regex for <a href="">)
  const htmlLinkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
  const lines = content.split('\n');

  lines.forEach((lineContent, index) => {
    let match;
    while ((match = htmlLinkRegex.exec(lineContent)) !== null) {
      const url = match[1];
      links.push({
        url,
        text: '', // Would need HTML parsing to extract text
        file: filePath,
        line: index + 1,
        type: 'html',
        isExternal: isExternalUrl(url),
        isAnchor: isAnchorOnly(url),
      });
    }
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
