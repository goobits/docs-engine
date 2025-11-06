import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export function sanitizeHtml(html: string, options?: SanitizeOptions): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options?.allowedTags || ['mark', 'span', 'div'],
    ALLOWED_ATTR: options?.allowedAttributes || ['class', 'id'],
  });
}

export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    ALLOWED_TAGS: [
      'svg',
      'g',
      'path',
      'rect',
      'text',
      'circle',
      'line',
      'polyline',
      'polygon',
      'defs',
      'marker',
      'foreignObject',
    ],
    ALLOWED_ATTR: [
      'class',
      'id',
      'd',
      'fill',
      'stroke',
      'viewBox',
      'xmlns',
      'x',
      'y',
      'width',
      'height',
      'cx',
      'cy',
      'r',
      'points',
      'transform',
      'style',
      'stroke-width',
      'stroke-dasharray',
      'font-size',
      'font-family',
      'text-anchor',
      'dominant-baseline',
    ],
  });
}

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Escape HTML entities in error messages
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
