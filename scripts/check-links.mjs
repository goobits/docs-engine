#!/usr/bin/env node

/**
 * Link Checker Script
 *
 * Validates internal and external links in markdown documentation.
 * Designed to be run as part of the build process.
 *
 * Usage:
 *   node scripts/check-links.mjs
 *   BUILD_SKIP_LINK_CHECK=1 node scripts/check-links.mjs  # Skip check
 */

import { glob } from 'glob';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  baseDir: 'docs',
  include: ['**/*.md', '**/*.mdx'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/versioned_docs/**',
    '**/.generated/**',
  ],
  checkExternal: false,
  timeout: 5000,
  concurrency: 10,
  skipDomains: ['localhost', '127.0.0.1', 'example.com'],
  validExtensions: ['.md', '.mdx'],
};

/**
 * Load configuration from file or use defaults
 */
function loadConfig() {
  const configFiles = ['.linkcheckerrc.json', '.linkcheckerrc', 'linkchecker.config.json'];

  for (const configFile of configFiles) {
    const configPath = resolve(projectRoot, configFile);
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const fileConfig = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...fileConfig };
      } catch (error) {
        console.error(`Error loading config from ${configPath}:`, error.message);
      }
    }
  }

  return DEFAULT_CONFIG;
}

// ============================================================================
// Link Extraction
// ============================================================================

/**
 * Extract links from markdown file using regex
 * (Simple alternative to AST parsing for build script)
 */
function extractLinksFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const links = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Track code block boundaries
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return; // Skip the code fence line itself
    }

    // Skip links inside code blocks
    if (inCodeBlock) {
      return;
    }

    // Skip HTML comments (<!-- ... -->)
    if (line.trim().startsWith('<!--') || line.includes('<!--')) {
      return;
    }

    // Markdown links: [text](url)
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      const url = match[2];
      const text = match[1];

      // Skip if this link is inside inline code (backticks)
      const beforeLink = line.substring(0, match.index);
      const backticksBefore = (beforeLink.match(/`/g) || []).length;
      if (backticksBefore % 2 === 1) {
        continue; // Inside inline code
      }

      links.push({
        url,
        text,
        file: filePath,
        line: lineNumber,
        type: 'link',
        isExternal: /^https?:\/\//i.test(url),
        isAnchor: url.startsWith('#'),
      });
    }

    // Markdown images: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = imageRegex.exec(line)) !== null) {
      const url = match[2];
      const text = match[1];

      // Skip if this image is inside inline code (backticks)
      const beforeImage = line.substring(0, match.index);
      const backticksBefore = (beforeImage.match(/`/g) || []).length;
      if (backticksBefore % 2 === 1) {
        continue; // Inside inline code
      }

      links.push({
        url,
        text,
        file: filePath,
        line: lineNumber,
        type: 'image',
        isExternal: /^https?:\/\//i.test(url),
        isAnchor: url.startsWith('#'),
      });
    }

    // HTML links: <a href="url">
    const htmlLinkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
    while ((match = htmlLinkRegex.exec(line)) !== null) {
      const url = match[1];

      // Skip if this link is inside inline code (backticks)
      const beforeLink = line.substring(0, match.index);
      const backticksBefore = (beforeLink.match(/`/g) || []).length;
      if (backticksBefore % 2 === 1) {
        continue; // Inside inline code
      }

      links.push({
        url,
        text: '',
        file: filePath,
        line: lineNumber,
        type: 'html',
        isExternal: /^https?:\/\//i.test(url),
        isAnchor: url.startsWith('#'),
      });
    }
  });

  return links;
}

/**
 * Extract links from multiple files
 */
function extractLinksFromFiles(filePaths) {
  const allLinks = [];
  for (const file of filePaths) {
    try {
      const links = extractLinksFromFile(file);
      allLinks.push(...links);
    } catch (error) {
      console.error(`Error extracting links from ${file}:`, error.message);
    }
  }
  return allLinks;
}

// ============================================================================
// Link Validation
// ============================================================================

/**
 * Resolve a link path relative to source file and base directory
 */
function resolveLinkPath(link, sourceFile, baseDir) {
  const [pathPart] = link.split('#');

  if (pathPart.startsWith('/')) {
    // Check if this is a static asset path (e.g., /screenshots/, /images/)
    // These are served from the static/ directory at runtime
    const staticPath = resolve(projectRoot, 'static', pathPart.slice(1));
    if (existsSync(staticPath)) {
      return staticPath;
    }

    // Otherwise, treat as absolute path from docs root
    return resolve(baseDir, pathPart.slice(1));
  }

  // Relative path from source file
  const sourceDir = dirname(sourceFile);
  return resolve(sourceDir, pathPart);
}

/**
 * Check if anchor exists in markdown file
 */
function anchorExistsInFile(filePath, anchor) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const normalizedAnchor = anchor.toLowerCase().replace(/\s+/g, '-');

    // Check for markdown headers
    const headerRegex = /^#+\s+(.+)$/gm;
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      const headerText = match[1];
      const headerId = headerText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      if (headerId === normalizedAnchor) {
        return true;
      }
    }

    // Check for HTML anchors
    const htmlAnchorRegex = /<a\s+(?:name|id)=["']([^"']+)["']/gi;
    while ((match = htmlAnchorRegex.exec(content)) !== null) {
      if (match[1] === anchor) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Validate an internal link
 */
function validateInternalLink(link, config) {
  const { baseDir, validExtensions } = config;

  try {
    let targetPath = resolveLinkPath(link.url, link.file, resolve(projectRoot, baseDir));

    // Check if file exists as-is
    let fileExists = existsSync(targetPath);

    // Try adding valid extensions
    if (!fileExists) {
      for (const ext of validExtensions) {
        const pathWithExt = targetPath + ext;
        if (existsSync(pathWithExt)) {
          targetPath = pathWithExt;
          fileExists = true;
          break;
        }
      }
    }

    // Check if it's a directory with index file
    if (!fileExists && existsSync(targetPath)) {
      try {
        const stat = statSync(targetPath);
        if (stat.isDirectory()) {
          for (const ext of validExtensions) {
            const indexPath = join(targetPath, `index${ext}`);
            if (existsSync(indexPath)) {
              targetPath = indexPath;
              fileExists = true;
              break;
            }
          }
        }
      } catch {
        // statSync failed - path doesn't exist or isn't accessible
      }
    }

    if (!fileExists) {
      return {
        link,
        isValid: false,
        error: `File not found: ${targetPath}`,
      };
    }

    // Check anchor if present
    const [, anchor] = link.url.split('#');
    if (anchor) {
      const anchorExists = anchorExistsInFile(targetPath, anchor);
      if (!anchorExists) {
        return {
          link,
          isValid: false,
          error: `Anchor #${anchor} not found in ${targetPath}`,
        };
      }
    }

    return { link, isValid: true };
  } catch (error) {
    return {
      link,
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Validate all links
 */
function validateLinks(links, config) {
  const results = [];
  const internalLinks = links.filter((l) => !l.isExternal);

  for (const link of internalLinks) {
    results.push(validateInternalLink(link, config));
  }

  return results;
}

// ============================================================================
// Reporting
// ============================================================================

/**
 * Print validation results
 */
function printResults(results) {
  const stats = {
    total: results.length,
    valid: results.filter((r) => r.isValid).length,
    broken: results.filter((r) => !r.isValid).length,
  };

  console.log('\n🔍 Link Validation Results\n');

  // Print broken links
  const broken = results.filter((r) => !r.isValid);
  if (broken.length > 0) {
    console.log(`❌ Broken Links (${broken.length}):\n`);
    broken.forEach((result) => {
      const location = `${result.link.file}:${result.link.line}`;
      console.log(`  ${location}`);
      console.log(`    Link: ${result.link.url}`);
      console.log(`    Error: ${result.error}\n`);
    });
  }

  // Print summary
  console.log('📊 Summary:');
  console.log(`  Total links:  ${stats.total}`);
  console.log(`  Valid:        ${stats.valid}`);
  console.log(`  Broken:       ${stats.broken}`);

  if (stats.broken === 0) {
    console.log('\n✨ All links are valid!\n');
  } else {
    console.log(`\n💔 Found ${stats.broken} broken link(s)\n`);
  }

  return stats.broken === 0;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  // Check for skip flag
  if (process.env.BUILD_SKIP_LINK_CHECK === '1') {
    console.log('⚠️  Link checking skipped (BUILD_SKIP_LINK_CHECK=1)');
    process.exit(0);
  }

  console.log('🔗 Starting link validation...\n');

  // Load configuration
  const config = loadConfig();
  const docsDir = resolve(projectRoot, config.baseDir);

  console.log(`📁 Base directory: ${config.baseDir}`);
  console.log(`📄 Patterns: ${config.include.join(', ')}\n`);

  // Find markdown files
  const files = await glob(config.include, {
    cwd: docsDir,
    absolute: true,
    ignore: config.exclude,
  });

  if (files.length === 0) {
    console.log('⚠️  No markdown files found');
    process.exit(0);
  }

  console.log(`Found ${files.length} markdown file(s)`);

  // Extract links
  const links = extractLinksFromFiles(files);
  console.log(`Extracted ${links.length} link(s)`);

  // Filter to internal links only (for speed)
  const internalLinks = links.filter((l) => !l.isExternal && !l.isAnchor);
  console.log(`Checking ${internalLinks.length} internal link(s)...`);

  // Validate links
  const results = validateLinks(internalLinks, config);

  // Print results
  const success = printResults(results);

  process.exit(success ? 0 : 1);
}

// Run
main().catch((error) => {
  console.error('❌ Link checking failed:', error);
  process.exit(1);
});
