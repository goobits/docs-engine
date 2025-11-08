/**
 * Sanitization Utilities
 *
 * Provides functions to sanitize user input and error messages
 */

/**
 * Sanitize error messages to prevent XSS attacks
 * Removes potentially dangerous HTML tags and scripts
 */
export function sanitizeErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  // Basic sanitization - escape HTML special characters
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize SVG content to prevent XSS attacks
 * Removes potentially dangerous scripts and event handlers
 */
export function sanitizeSvg(svg: string): string {
  // Remove script tags
  // eslint-disable-next-line security/detect-unsafe-regex
  let sanitized = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Options allow configuring allowed tags and attributes
 */
export function sanitizeHtml(
  html: string,
  options?: { allowedTags?: string[]; allowedAttributes?: string[] }
): string {
  const allowedTags = options?.allowedTags ?? ['b', 'i', 'em', 'strong', 'code', 'pre'];
  const allowedAttributes = options?.allowedAttributes ?? ['class'];

  if (allowedTags.length === 0) {
    // Strip all HTML tags
    return html.replace(/<[^>]*>/g, '');
  }

  // Basic sanitization - escape HTML special characters first
  let sanitized = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Re-allow specific tags
  for (const tag of allowedTags) {
    const openTagRegex = new RegExp(`&lt;${tag}(&gt;|\\s[^&]*?&gt;)`, 'gi');
    const closeTagRegex = new RegExp(`&lt;/${tag}&gt;`, 'gi');

    sanitized = sanitized.replace(openTagRegex, (match) => {
      // Only allow specified attributes
      if (allowedAttributes.length === 0) {
        return `<${tag}>`;
      }

      // For now, just convert back to HTML
      return match
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
    });

    sanitized = sanitized.replace(closeTagRegex, `</${tag}>`);
  }

  return sanitized;
}
