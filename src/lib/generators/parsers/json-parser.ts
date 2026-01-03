/**
 * JSON Parser
 *
 * Parses JSON files and extracts items from a specified path.
 */

import type { ParsedItem } from './types';

/**
 * Parse JSON content and extract items from a path
 * @param content - Raw JSON string
 * @param path - Optional dot-notation path to extract (e.g., "scripts" or "dependencies.dev")
 * @returns Array of parsed items
 */
export function parseJSON(content: string, path?: string): ParsedItem[] {
  const data = JSON.parse(content);

  if (!path) {
    // If no path, assume data is array or convert object to entries
    return Array.isArray(data)
      ? data
      : Object.entries(data).map(([key, value]) => ({ key, value }));
  }

  // Extract from path (e.g., "scripts" -> data.scripts)
  const extracted = path.split('.').reduce((obj, key) => obj?.[key], data);

  if (!extracted) {
    throw new Error(`Path "${path}" not found in JSON`);
  }

  // Convert to array of items
  if (Array.isArray(extracted)) {
    return extracted;
  }

  // Convert object to array with key-value pairs
  return Object.entries(extracted).map(([key, value]) => ({
    name: key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }));
}
