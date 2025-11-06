import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeSvg, sanitizeErrorMessage } from './sanitize';

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script><div>Safe</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Safe');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('should allow safe HTML tags', () => {
    const input = '<div class="test"><span>Safe content</span></div>';
    const result = sanitizeHtml(input);
    expect(result).toContain('div');
    expect(result).toContain('span');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should handle malformed HTML', () => {
    const input = '<div><span>Unclosed';
    const result = sanitizeHtml(input);
    expect(result).toBeTruthy();
  });

  it('should remove javascript: protocol from links', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should remove data: protocol from images', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data:text/html');
  });

  it('should handle nested XSS attempts', () => {
    const input = '<div><img src=x onerror="alert(1)"></div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
  });

  it('should preserve allowed attributes', () => {
    const input = '<div class="container" id="main">Content</div>';
    const result = sanitizeHtml(input);
    expect(result).toContain('class');
    expect(result).toContain('id');
  });

  it('should remove style attributes with expressions', () => {
    const input = '<div style="width: expression(alert(1))">Content</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('expression');
  });
});

describe('sanitizeSvg', () => {
  it('should allow SVG elements', () => {
    const input = '<svg><path d="M0,0 L10,10"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).toContain('svg');
    expect(result).toContain('path');
  });

  it('should remove script in SVG', () => {
    const input = '<svg><script>alert(1)</script><circle/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('script');
  });

  it('should allow common SVG attributes', () => {
    const input =
      '<svg viewBox="0 0 100 100"><rect x="0" y="0" width="50" height="50" fill="red"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).toContain('viewBox');
    expect(result).toContain('width');
    expect(result).toContain('height');
    expect(result).toContain('fill');
  });

  it('should remove event handlers in SVG', () => {
    const input = '<svg><circle onclick="alert(1)" cx="50" cy="50" r="40"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('onclick');
  });

  it('should allow SVG paths with complex data', () => {
    const input = '<svg><path d="M 10 10 L 90 90 L 10 90 Z" stroke="black" fill="none"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).toContain('path');
    expect(result).toContain('stroke');
  });

  it('should handle empty SVG', () => {
    const input = '<svg></svg>';
    const result = sanitizeSvg(input);
    expect(result).toContain('svg');
  });

  it('should allow foreign object elements but sanitize content', () => {
    const input =
      '<svg><foreignObject><body><script>alert(1)</script></body></foreignObject></svg>';
    const result = sanitizeSvg(input);
    // foreignObject is allowed for certain use cases (e.g., text in diagrams)
    expect(result).toContain('foreignObject');
    // But scripts should still be removed
    expect(result).not.toContain('script');
  });
});

describe('sanitizeErrorMessage', () => {
  it('should escape HTML entities', () => {
    const error = new Error('<script>alert("xss")</script>');
    const result = sanitizeErrorMessage(error);
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should handle Error objects', () => {
    const error = new Error('Test error');
    const result = sanitizeErrorMessage(error);
    expect(result).toBe('Test error');
  });

  it('should handle non-Error objects', () => {
    const result = sanitizeErrorMessage('String error');
    expect(result).toBe('String error');
  });

  it('should escape ampersands', () => {
    const error = new Error('Error with & symbol');
    const result = sanitizeErrorMessage(error);
    expect(result).toContain('&amp;');
  });

  it('should escape quotes', () => {
    const error = new Error('Error with "quotes" and \'apostrophes\'');
    const result = sanitizeErrorMessage(error);
    expect(result).toContain('&quot;');
    expect(result).toContain('&#039;');
  });

  it('should handle empty error message', () => {
    const error = new Error('');
    const result = sanitizeErrorMessage(error);
    expect(result).toBe('');
  });

  it('should handle null or undefined', () => {
    const result1 = sanitizeErrorMessage(null);
    const result2 = sanitizeErrorMessage(undefined);
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
  });
});
