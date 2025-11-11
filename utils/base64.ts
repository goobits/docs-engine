/**
 * Base64 Utilities
 *
 * Provides functions for encoding/decoding base64 data
 */

/**
 * Decode a base64-encoded JSON string
 */
export function decodeJsonBase64<T = unknown>(encoded: string): T {
  const decoded =
    typeof atob !== 'undefined' ? atob(encoded) : Buffer.from(encoded, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}

/**
 * Encode data as base64 JSON string
 */
export function encodeJsonBase64(data: unknown): string {
  const json = JSON.stringify(data);
  return typeof btoa !== 'undefined' ? btoa(json) : Buffer.from(json, 'utf-8').toString('base64');
}
