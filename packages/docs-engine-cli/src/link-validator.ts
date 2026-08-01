import { existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import pLimit from 'p-limit';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import type { Heading, Html } from 'mdast';
import type { ExtractedLink, ResolvedLinkCheckerConfig, ValidationResult } from './_linkModels.js';

// ============================================================================
// Module-Private Helpers (True Privacy via ESM)
// ============================================================================

/**
 * Resolve a relative link to an absolute file path
 * Module-private helper - not exported, not accessible outside this module
 *
 * Handles:
 * - Relative paths: `./file.md`, `../file.md`
 * - Absolute paths: `/docs/file.md`
 * - Removes `.md` extension for route matching
 * - Supports anchor links: `file.md#section`
 */
function resolveLinkPaths(
  link: string,
  sourceFile: string,
  baseDir: string,
  publicDir?: string,
  routePrefix?: string
): string[] {
  // Remove anchor
  const [pathPart] = link.split('#');

  if (!pathPart) {
    return [sourceFile];
  }

  // Handle absolute paths
  if (pathPart.startsWith('/')) {
    const relativePath = pathPart.slice(1);
    const contentPath = removeRoutePrefix(relativePath, routePrefix);
    return [
      resolve(baseDir, contentPath),
      ...(publicDir ? [resolve(publicDir, relativePath)] : []),
    ];
  }

  // Handle relative paths
  const sourceDir = dirname(sourceFile);
  return [resolve(sourceDir, pathPart)];
}

function removeRoutePrefix(relativePath: string, routePrefix?: string): string {
  const normalizedPrefix = routePrefix?.replace(/^\/+|\/+$/g, '');
  if (!normalizedPrefix) return relativePath;
  if (relativePath === normalizedPrefix) return '';

  const prefixWithSeparator = `${normalizedPrefix}/`;
  return relativePath.startsWith(prefixWithSeparator)
    ? relativePath.slice(prefixWithSeparator.length)
    : relativePath;
}

function findExistingFile(targetPath: string, validExtensions: string[]): string | undefined {
  const candidates = [targetPath, ...validExtensions.map((extension) => targetPath + extension)];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (!statSync(candidate).isDirectory()) return candidate;

    for (const extension of validExtensions) {
      const indexPath = join(candidate, `index${extension}`);
      if (existsSync(indexPath)) return indexPath;
    }
  }

  return undefined;
}

/**
 * Extract anchor from URL
 * Module-private helper - not exported, not accessible outside this module
 */
function extractAnchor(url: string): string | undefined {
  const parts = url.split('#');
  return parts.length > 1 ? parts[1] : undefined;
}

/**
 * Check if an anchor exists in a markdown file
 * Module-private helper - not exported, not accessible outside this module
 *
 * Checks for:
 * - Headers: `## Section Name` → `#section-name`
 * - HTML anchors: `<a name="anchor">` or `<a id="anchor">`
 */
interface FileAnchorIndex {
  headings: Set<string>;
  html: Set<string>;
}

type AnchorIndexCache = Map<string, FileAnchorIndex>;

function anchorExistsInFile(
  filePath: string,
  anchor: string,
  anchorIndexCache: AnchorIndexCache
): boolean {
  const cached = anchorIndexCache.get(filePath);
  if (cached) {
    return cached.headings.has(normalizeLinkAnchor(anchor)) || cached.html.has(anchor);
  }

  const anchorIndex: FileAnchorIndex = {
    headings: new Set<string>(),
    html: new Set<string>(),
  };

  try {
    const content = readFileSync(filePath, 'utf-8');
    const tree = unified().use(remarkParse).use(remarkGfm).parse(content);

    visit(tree, 'heading', (node: Heading) => {
      anchorIndex.headings.add(normalizeHeadingAnchor(headingText(node)));
    });

    visit(tree, 'html', (node: Html) => {
      const idRegex = /\sid=["']([^"']+)["']/gi;
      const namedAnchorRegex = /<a\b[^>]*\sname=["']([^"']+)["']/gi;
      let match;

      while ((match = idRegex.exec(node.value)) !== null) {
        anchorIndex.html.add(match[1]);
      }
      while ((match = namedAnchorRegex.exec(node.value)) !== null) {
        anchorIndex.html.add(match[1]);
      }
    });
  } catch {
    // An unreadable file has no usable anchors for this validation run.
  }

  anchorIndexCache.set(filePath, anchorIndex);
  return anchorIndex.headings.has(normalizeLinkAnchor(anchor)) || anchorIndex.html.has(anchor);
}

function normalizeLinkAnchor(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function normalizeHeadingAnchor(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function headingText(node: Heading): string {
  const collect = (value: { value?: unknown; children?: unknown[] }): string => {
    if (typeof value.value === 'string') return value.value;
    return Array.isArray(value.children)
      ? value.children
          .map((child) => collect(child as { value?: unknown; children?: unknown[] }))
          .join('')
      : '';
  };

  return collect(node as unknown as { value?: unknown; children?: unknown[] });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validate an internal link
 *
 * Checks:
 * - File exists
 * - Anchor exists (if present)
 * - Handles .md extension conversion
 *
 * @param link - Link to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateInternalLink(link, { baseDir: '/project' });
 * if (!result.isValid) {
 *   console.error(`Broken link: ${result.error}`);
 * }
 * ```
 *
 * @public
 */
export function validateInternalLink(
  link: ExtractedLink,
  options: ResolvedLinkCheckerConfig
): ValidationResult {
  return validateInternalLinkWithCache(link, options, new Map());
}

function validateInternalLinkWithCache(
  link: ExtractedLink,
  options: ResolvedLinkCheckerConfig,
  anchorIndexCache: AnchorIndexCache
): ValidationResult {
  const { baseDir, publicDir, routePrefix, validExtensions = ['.md', '.mdx'] } = options;

  try {
    const candidatePaths = resolveLinkPaths(link.url, link.file, baseDir, publicDir, routePrefix);
    const targetPath = candidatePaths
      .map((candidate) => findExistingFile(candidate, validExtensions))
      .find((candidate): candidate is string => candidate !== undefined);

    if (!targetPath) {
      return {
        link,
        isValid: false,
        error: `File not found: ${candidatePaths.join(' or ')}`,
      };
    }

    // Check anchor if present
    const anchor = extractAnchor(link.url);
    if (anchor) {
      const anchorExists = anchorExistsInFile(targetPath, anchor, anchorIndexCache);
      if (!anchorExists) {
        return {
          link,
          isValid: false,
          error: `Anchor #${anchor} not found in ${targetPath}`,
        };
      }
    }

    return {
      link,
      isValid: true,
    };
  } catch (error) {
    return {
      link,
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate an external link with HTTP request
 *
 * @param link - Link to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = await validateExternalLink(link, { timeout: 5000 });
 * console.log(`Status: ${result.statusCode}`);
 * ```
 *
 * @public
 */
export async function validateExternalLink(
  link: ExtractedLink,
  options: ResolvedLinkCheckerConfig
): Promise<ValidationResult> {
  const { timeout = 5000, skipDomains = [] } = options;

  try {
    // Check if domain should be skipped
    const url = new URL(link.url);
    if (skipDomains.some((domain) => url.hostname.includes(domain))) {
      return {
        link,
        isValid: true,
        statusCode: 0, // Skipped
      };
    }

    // Make HEAD request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(link.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    const isValid = response.ok; // 200-299

    return {
      link,
      isValid,
      statusCode: response.status,
      redirectUrl: response.redirected ? response.url : undefined,
      error: isValid ? undefined : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      link,
      isValid: false,
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

/**
 * Validate multiple links with concurrency control
 *
 * @param links - Links to validate
 * @param options - Validation options
 * @returns Array of validation results
 *
 * @example
 * ```typescript
 * const results = await validateLinks(allLinks, {
 *   baseDir: '/project',
 *   checkExternal: true,
 *   concurrency: 10
 * });
 *
 * const broken = results.filter(r => !r.isValid);
 * console.log(`Found ${broken.length} broken links`);
 * ```
 *
 * @public
 */
export async function validateLinks(
  links: ExtractedLink[],
  options: ResolvedLinkCheckerConfig
): Promise<ValidationResult[]> {
  const { concurrency = 10, checkExternal = false } = options;
  const results: ValidationResult[] = [];

  // Separate internal and external links
  const internalLinks = links.filter((l) => !l.isExternal);
  const externalLinks = links.filter((l) => l.isExternal);
  const anchorIndexCache: AnchorIndexCache = new Map();

  // Validate internal links (synchronous)
  for (const link of internalLinks) {
    results.push(validateInternalLinkWithCache(link, options, anchorIndexCache));
  }

  // Validate external links (asynchronous with concurrency)
  if (checkExternal && externalLinks.length > 0) {
    const limit = pLimit(concurrency);
    const externalResults = await Promise.all(
      externalLinks.map((link) => limit(() => validateExternalLink(link, options)))
    );
    results.push(...externalResults);
  }

  return results;
}
