/**
 * Environment-safe base64 decoding
 * Works in both Node.js and browser environments
 */

import { ValidationError } from './errors.js';

/**
 * Decode base64 string to UTF-8 text
 * @param encoded - Base64 encoded string
 * @returns Decoded UTF-8 string
 * @throws ValidationError if decoding fails
 */
export function decodeBase64(encoded: string): string {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		try {
			return Buffer.from(encoded, 'base64').toString('utf-8');
		} catch (error) {
			throw ValidationError.invalidValue('encoded', encoded, 'Invalid base64 string');
		}
	} else if (typeof atob !== 'undefined') {
		// Browser environment
		try {
			// atob returns a binary string, decode UTF-8
			const binaryString = atob(encoded);
			// Convert binary string to UTF-8
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			return new TextDecoder('utf-8').decode(bytes);
		} catch (error) {
			throw ValidationError.invalidValue('encoded', encoded, 'Invalid base64 string');
		}
	} else {
		throw new Error('No base64 decoding available in this environment');
	}
}

/**
 * Encode UTF-8 text to base64
 * @param text - UTF-8 string to encode
 * @returns Base64 encoded string
 * @throws ValidationError if encoding fails
 */
export function encodeBase64(text: string): string {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		try {
			return Buffer.from(text, 'utf-8').toString('base64');
		} catch (error) {
			throw ValidationError.invalidValue('text', text, 'Failed to encode as base64');
		}
	} else if (typeof btoa !== 'undefined') {
		// Browser environment
		try {
			// Encode UTF-8 to binary string
			const bytes = new TextEncoder().encode(text);
			let binaryString = '';
			for (let i = 0; i < bytes.length; i++) {
				binaryString += String.fromCharCode(bytes[i]);
			}
			return btoa(binaryString);
		} catch (error) {
			throw ValidationError.invalidValue('text', text, 'Failed to encode as base64');
		}
	} else {
		throw new Error('No base64 encoding available in this environment');
	}
}

/**
 * Encode object as JSON then Base64 (common pattern in plugins)
 *
 * This is a convenience method used extensively in the plugin system
 * to safely embed structured data in HTML attributes.
 *
 * @param data - Any JSON-serializable object
 * @returns Base64-encoded JSON string
 * @throws ValidationError if data cannot be serialized
 *
 * @example
 * ```typescript
 * const treeData = { name: 'src', children: [...] };
 * const encoded = encodeJsonBase64(treeData);
 * // Use in HTML: <div data-tree="${encoded}"></div>
 * ```
 */
export function encodeJsonBase64<T>(data: T): string {
	try {
		return encodeBase64(JSON.stringify(data));
	} catch (error) {
		throw ValidationError.invalidValue(
			'data',
			data,
			`Failed to encode object as JSON+Base64: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Decode Base64 JSON back to object
 *
 * Counterpart to encodeJsonBase64() for client-side hydration.
 *
 * @param encoded - Base64-encoded JSON string
 * @returns Decoded object
 * @throws ValidationError if encoded string is invalid base64 or invalid JSON
 *
 * @example
 * ```typescript
 * const encoded = element.getAttribute('data-tree');
 * const treeData = decodeJsonBase64<TreeNode[]>(encoded);
 * ```
 */
export function decodeJsonBase64<T>(encoded: string): T {
	try {
		const decoded = decodeBase64(encoded);
		return JSON.parse(decoded) as T;
	} catch (error) {
		// Re-throw ValidationError from decodeBase64
		if (error instanceof ValidationError) {
			throw error;
		}
		// JSON.parse error
		throw ValidationError.invalidValue(
			'encoded',
			encoded,
			`Failed to parse decoded JSON: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}
