/**
 * HTML encoding and decoding utilities
 *
 * These utilities are used throughout the plugin system to safely escape
 * user-generated content and prevent XSS vulnerabilities.
 *
 * @module html
 * @public
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
} as const;

const HTML_UNESCAPES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
} as const;

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * Converts characters that have special meaning in HTML (&, <, >, ", ')
 * into their HTML entity equivalents.
 *
 * @param text - Text containing potential HTML special characters
 * @returns HTML-safe string with escaped characters
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 * ```
 *
 * @public
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Unescape HTML entities back to original characters
 *
 * Converts HTML entities (&amp;, &lt;, etc.) back to their
 * original character representations.
 *
 * @param html - HTML string containing entities
 * @returns Original text with entities converted back
 *
 * @example
 * ```typescript
 * unescapeHtml('&lt;div&gt;Hello&lt;/div&gt;')
 * // Returns: '<div>Hello</div>'
 * ```
 *
 * @public
 */
export function unescapeHtml(html: string): string {
  return html.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => HTML_UNESCAPES[entity]);
}

/**
 * Escape HTML attributes (includes additional characters for attribute safety)
 *
 * In addition to standard HTML escaping, this also escapes newlines and
 * carriage returns which can be problematic in HTML attributes.
 *
 * @param text - Text to be used in an HTML attribute
 * @returns Attribute-safe string
 *
 * @example
 * ```typescript
 * escapeAttribute('Click\nHere')
 * // Returns: 'Click&#10;Here'
 * ```
 *
 * @public
 */
export function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/\n/g, '&#10;').replace(/\r/g, '&#13;');
}
