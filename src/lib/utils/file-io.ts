/**
 * File I/O utilities for documentation generation
 * Server-side only (uses Node.js fs APIs)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Read a file and return its contents
 *
 * @param filePath - Path to file
 * @returns File contents as string
 * @throws Error if file cannot be read
 *
 * @example
 * ```typescript
 * const content = readFile('./docs/readme.md');
 * ```
 */
export function readFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file ${filePath}: ${message}`);
  }
}

/**
 * Write content to a file, creating directories if needed
 *
 * @param filePath - Path to file
 * @param content - Content to write
 * @throws Error if file cannot be written
 *
 * @example
 * ```typescript
 * writeFile('./docs/generated/api.md', '# API Documentation\n...');
 * // Creates ./docs/generated/ directory if it doesn't exist
 * ```
 */
export function writeFile(filePath: string, content: string): void {
  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });

    // Write file
    writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write file ${filePath}: ${message}`);
  }
}

/**
 * Parse JSON file
 *
 * @param filePath - Path to JSON file
 * @returns Parsed JSON object
 * @throws Error if file cannot be read or parsed
 *
 * @example
 * ```typescript
 * interface PackageJson {
 *   name: string;
 *   version: string;
 * }
 * const pkg = readJSON<PackageJson>('./package.json');
 * console.log(pkg.name);
 * ```
 */
export function readJSON<T = any>(filePath: string): T {
  try {
    const content = readFile(filePath);
    return JSON.parse(content) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON file ${filePath}: ${message}`);
  }
}

/**
 * Write JSON to a file with formatting
 *
 * @param filePath - Path to JSON file
 * @param data - Data to serialize
 * @param indent - Indentation (default: 2 spaces)
 * @throws Error if file cannot be written
 *
 * @example
 * ```typescript
 * writeJSON('./data.json', { foo: 'bar' }, 2);
 * ```
 */
export function writeJSON<T = any>(filePath: string, data: T, indent: number = 2): void {
  const content = JSON.stringify(data, null, indent);
  writeFile(filePath, content);
}

/**
 * Count lines in a string
 *
 * @param text - Text to count
 * @returns Number of lines
 *
 * @example
 * ```typescript
 * const lines = countLines('line1\nline2\nline3');
 * console.log(lines); // 3
 * ```
 */
export function countLines(text: string): number {
  return text.split('\n').length;
}
