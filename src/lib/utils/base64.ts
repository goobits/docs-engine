/**
 * Environment-safe base64 decoding
 * Works in both Node.js and browser environments
 */

/**
 * Decode base64 string to UTF-8 text
 * @param encoded - Base64 encoded string
 * @returns Decoded UTF-8 string
 */
export function decodeBase64(encoded: string): string {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		return Buffer.from(encoded, 'base64').toString('utf-8');
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
		} catch (err) {
			console.error('Failed to decode base64:', err);
			return '';
		}
	} else {
		throw new Error('No base64 decoding available in this environment');
	}
}

/**
 * Encode UTF-8 text to base64
 * @param text - UTF-8 string to encode
 * @returns Base64 encoded string
 */
export function encodeBase64(text: string): string {
	if (typeof Buffer !== 'undefined') {
		// Node.js environment
		return Buffer.from(text, 'utf-8').toString('base64');
	} else if (typeof btoa !== 'undefined') {
		// Browser environment
		// Encode UTF-8 to binary string
		const bytes = new TextEncoder().encode(text);
		let binaryString = '';
		for (let i = 0; i < bytes.length; i++) {
			binaryString += String.fromCharCode(bytes[i]);
		}
		return btoa(binaryString);
	} else {
		throw new Error('No base64 encoding available in this environment');
	}
}
