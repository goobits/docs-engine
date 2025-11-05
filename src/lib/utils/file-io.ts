/**
 * File I/O utilities for documentation generation
 * Server-side only (uses Node.js fs APIs)
 */

import fsp from 'fs/promises';
import { dirname } from 'path';
import { FileIOError, retryWithBackoff } from './errors.js';

/**
 * Read a file and return its contents (async)
 *
 * @param filePath - Path to file
 * @returns File contents as string
 * @throws FileIOError if file cannot be read
 *
 * @example
 * ```typescript
 * const content = await readFile('./docs/readme.md');
 * ```
 */
export async function readFile(filePath: string): Promise<string> {
	try {
		return await retryWithBackoff(
			() => fsp.readFile(filePath, 'utf-8'),
			{ maxRetries: 2 }
		);
	} catch (error) {
		throw FileIOError.read(filePath, error);
	}
}

/**
 * Write content to a file, creating directories if needed (async)
 *
 * @param filePath - Path to file
 * @param content - Content to write
 * @throws FileIOError if file cannot be written
 *
 * @example
 * ```typescript
 * await writeFile('./docs/generated/api.md', '# API Documentation\n...');
 * // Creates ./docs/generated/ directory if it doesn't exist
 * ```
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
	try {
		// Ensure directory exists
		const dir = dirname(filePath);
		await fsp.mkdir(dir, { recursive: true });

		// Write file with retry logic
		await retryWithBackoff(
			() => fsp.writeFile(filePath, content, 'utf-8'),
			{ maxRetries: 2 }
		);
	} catch (error) {
		throw FileIOError.write(filePath, error);
	}
}

/**
 * Parse JSON file (async)
 *
 * @param filePath - Path to JSON file
 * @returns Parsed JSON object
 * @throws FileIOError if file cannot be read or parsed
 *
 * @example
 * ```typescript
 * interface PackageJson {
 *   name: string;
 *   version: string;
 * }
 * const pkg = await readJSON<PackageJson>('./package.json');
 * console.log(pkg.name);
 * ```
 */
export async function readJSON<T = any>(filePath: string): Promise<T> {
	try {
		const content = await readFile(filePath);
		return JSON.parse(content) as T;
	} catch (error) {
		if (error instanceof FileIOError) {
			throw error;
		}
		throw FileIOError.read(filePath, new Error(`Failed to parse JSON: ${error}`));
	}
}

/**
 * Write JSON to a file with formatting (async)
 *
 * @param filePath - Path to JSON file
 * @param data - Data to serialize
 * @param indent - Indentation (default: 2 spaces)
 * @throws FileIOError if file cannot be written
 *
 * @example
 * ```typescript
 * await writeJSON('./data.json', { foo: 'bar' }, 2);
 * ```
 */
export async function writeJSON<T = any>(filePath: string, data: T, indent: number = 2): Promise<void> {
	const content = JSON.stringify(data, null, indent);
	await writeFile(filePath, content);
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
