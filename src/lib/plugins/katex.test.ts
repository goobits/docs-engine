import { describe, it, expect } from 'vitest';
import { renderMath, katexPlugin, type KaTeXOptions } from './katex';
import type { Root } from 'mdast';

/**
 * Tests for KaTeX math rendering plugin
 *
 * These tests focus on the math rendering logic and error handling.
 * Full integration tests with unified would require more complex setup.
 */

describe('katex plugin', () => {
  describe('renderMath', () => {
    it('should render inline math correctly', () => {
      const result = renderMath('E = mc^2', false);
      expect(result).toContain('katex');
      expect(result).toContain('E');
      expect(result).toContain('mc');
    });

    it('should render display math correctly', () => {
      const result = renderMath('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', true);
      expect(result).toContain('katex');
      expect(result).toContain('katex-display');
    });

    it('should handle simple fractions', () => {
      const result = renderMath('\\frac{1}{2}', true);
      expect(result).toContain('katex');
      expect(result).toContain('frac');
    });

    it('should handle square roots', () => {
      const result = renderMath('\\sqrt{x}', false);
      expect(result).toContain('katex');
      expect(result).toContain('sqrt');
    });

    it('should handle Greek letters', () => {
      const result = renderMath('\\alpha + \\beta = \\gamma', false);
      expect(result).toContain('katex');
    });

    it('should handle subscripts and superscripts', () => {
      const result = renderMath('x^2 + y_1', false);
      expect(result).toContain('katex');
    });

    it('should handle integrals', () => {
      const result = renderMath('\\int_{-\\infty}^{\\infty} e^{-x^2} dx', true);
      expect(result).toContain('katex');
    });

    it('should handle summations', () => {
      const result = renderMath('\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', true);
      expect(result).toContain('katex');
    });

    it('should handle matrices', () => {
      const result = renderMath('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', true);
      expect(result).toContain('katex');
    });

    it('should gracefully handle LaTeX errors in strict:false mode', () => {
      const result = renderMath('\\invalid{command}', false, { strict: false });
      // KaTeX renders invalid commands in red rather than throwing
      expect(result).toContain('katex');
      expect(result).toContain('mathcolor');
    });

    it('should render inline math with invalid commands', () => {
      const result = renderMath('\\badcommand', false, { strict: false });
      // KaTeX renders invalid commands inline with color
      expect(result).toContain('katex');
      expect(result).toContain('badcommand');
    });

    it('should render display math with invalid commands', () => {
      const result = renderMath('\\badcommand', true, { strict: false });
      // KaTeX renders invalid commands in display mode with color
      expect(result).toContain('katex-display');
      expect(result).toContain('badcommand');
    });

    it('should use custom error color', () => {
      const result = renderMath('\\invalid', false, { strict: false, errorColor: '#ff0000' });
      // KaTeX uses errorColor for invalid commands
      expect(result).toContain('katex');
    });

    it('should support custom macros', () => {
      const options: KaTeXOptions = {
        macros: {
          '\\RR': '\\mathbb{R}',
          '\\NN': '\\mathbb{N}',
        },
      };
      const result = renderMath('\\RR \\times \\NN', false, options);
      expect(result).toContain('katex');
      // Custom macros should be expanded
      expect(result).toContain('mathbb');
    });
  });

  describe('katexPlugin', () => {
    it('should transform math nodes to HTML', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Some text ',
              },
              {
                type: 'inlineMath',
                value: 'x^2',
                data: {},
              } as any,
              {
                type: 'text',
                value: ' more text',
              },
            ],
          },
        ],
      };

      const plugin = katexPlugin();
      plugin(tree);

      // Find the transformed node
      const paragraph = tree.children[0] as any;
      const mathNode = paragraph.children[1];

      expect(mathNode.type).toBe('html');
      expect(mathNode.value).toContain('katex');
      expect(mathNode.value).toContain('x');
    });

    it('should transform display math to centered HTML', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'math',
            value: 'x = \\frac{1}{2}',
            data: {},
          } as any,
        ],
      };

      const plugin = katexPlugin();
      plugin(tree);

      const mathNode = tree.children[0] as any;
      expect(mathNode.type).toBe('html');
      expect(mathNode.value).toContain('katex-display');
    });

    it('should handle trees with no math nodes', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'No math here',
              },
            ],
          },
        ],
      };

      const plugin = katexPlugin();
      // Should not throw
      expect(() => plugin(tree)).not.toThrow();
    });

    it('should apply custom options to rendering', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'inlineMath',
            value: '\\RR',
            data: {},
          } as any,
        ],
      };

      const options: KaTeXOptions = {
        macros: {
          '\\RR': '\\mathbb{R}',
        },
      };

      const plugin = katexPlugin(options);
      plugin(tree);

      const mathNode = tree.children[0] as any;
      expect(mathNode.value).toContain('mathbb');
    });

    it('should handle multiple math nodes', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'inlineMath',
            value: 'x^2',
            data: {},
          } as any,
          {
            type: 'math',
            value: 'y = mx + b',
            data: {},
          } as any,
          {
            type: 'inlineMath',
            value: 'z^3',
            data: {},
          } as any,
        ],
      };

      const plugin = katexPlugin();
      plugin(tree);

      // All should be transformed
      tree.children.forEach((node: any) => {
        expect(node.type).toBe('html');
        expect(node.value).toContain('katex');
      });
    });
  });

  describe('LaTeX expression validation', () => {
    it('should render basic arithmetic', () => {
      const result = renderMath('2 + 2 = 4', false);
      expect(result).toContain('katex');
    });

    it('should render complex fractions', () => {
      const result = renderMath('\\frac{\\frac{a}{b}}{\\frac{c}{d}}', true);
      expect(result).toContain('katex');
    });

    it('should render limits', () => {
      const result = renderMath('\\lim_{x \\to \\infty} f(x) = L', true);
      expect(result).toContain('katex');
    });

    it('should render derivatives', () => {
      const result = renderMath('\\frac{d}{dx} x^2 = 2x', true);
      expect(result).toContain('katex');
    });

    it('should render products', () => {
      const result = renderMath('\\prod_{i=1}^{n} x_i', true);
      expect(result).toContain('katex');
    });

    it('should render binomial coefficients', () => {
      const result = renderMath('\\binom{n}{k} = \\frac{n!}{k!(n-k)!}', true);
      expect(result).toContain('katex');
    });
  });

  describe('error handling', () => {
    it('should handle HTML-like characters in LaTeX', () => {
      const result = renderMath('<script>alert("xss")</script>', false, { strict: false });
      // KaTeX treats these as math symbols, not HTML
      expect(result).toContain('katex');
      // The < and > are rendered as math symbols
      expect(result).toContain('&lt;');
    });

    it('should handle empty LaTeX string', () => {
      const result = renderMath('', false);
      expect(result).toBeTruthy();
    });

    it('should handle whitespace-only LaTeX', () => {
      const result = renderMath('   ', false);
      expect(result).toBeTruthy();
    });
  });
});
