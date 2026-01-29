/**
 * ENV Parser
 *
 * Parses .env files with support for categories, comments, and variable detection.
 */

import type { ParsedItem } from './index';

/**
 * Parse .env file content
 * @param content - Raw .env file content
 * @param categoryPrefix - Prefix for category comments (default: '#')
 * @returns Array of parsed environment variables with metadata
 */
export function parseEnv(content: string, categoryPrefix = '#'): ParsedItem[] {
  const lines = content.split('\n');
  const variables: ParsedItem[] = [];
  let currentCategory = 'General';
  let currentComments: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      currentComments = [];
      continue;
    }

    // Category detection
    if (trimmed.startsWith(categoryPrefix)) {
      const categoryMatch = trimmed.match(/^#\s*---\s*(.+?)\s*---/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        currentComments = [];
        continue;
      }

      // Multi-line category format
      if (trimmed === '# ---') {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine?.startsWith('#')) {
          const categoryName = nextLine.replace(/^#\s*/, '').trim();
          if (categoryName && !categoryName.match(/^[-=]+$/)) {
            currentCategory = categoryName;
            i += 2; // Skip category lines
            currentComments = [];
            continue;
          }
        }
      }
    }

    // Variable line
    // Use single \s instead of \s* inside optional group to avoid nested quantifiers
    const varMatch = line.match(/^[ \t]*(#[ \t])?([A-Z][A-Z0-9_]*)[ \t]*=[ \t]*(.*)$/);
    if (varMatch) {
      const name = varMatch[2];
      let value = varMatch[3].trim();

      // Remove inline comments
      value = value.replace(/\s*#.*$/, '');

      // Remove quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      variables.push({
        category: currentCategory,
        name,
        value: value || '(not set)',
        description: currentComments.join(' ').trim() || 'No description',
        isCommented: !!varMatch[1],
      });

      currentComments = [];
      continue;
    }

    // Comment line
    if (trimmed.startsWith(categoryPrefix)) {
      const comment = trimmed.replace(/^#\s*/, '').trim();
      if (comment && !comment.match(/^[-=]+$/)) {
        currentComments.push(comment);
      }
    }
  }

  return variables;
}
