import { describe, it, expect } from 'vitest';
import { katexPlugin, type KaTeXOptions } from './katex';
import type { Root } from 'mdast';

/**
 * Tests for KaTeX math rendering plugin
 *
 * Following MODERN-PRIVACY.md guidelines:
 * - Tests focus on public API (katexPlugin) behavior
 * - Does NOT test private renderMath() function
 * - Tests actual user-facing functionality
 */

/**
 * Helper to create a test tree with inline math
 */
function createInlineMathTree(latex: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'inlineMath',
            value: latex,
            data: {},
          } as unknown,
        ],
      },
    ],
  };
}

/**
 * Helper to create a test tree with display math
 */
function createDisplayMathTree(latex: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'math',
        value: latex,
        data: {},
      } as unknown,
    ],
  };
}

/**
 * Helper to get the HTML output from a transformed tree
 */
function getHtmlOutput(tree: Root, index = 0): string {
  const node = tree.children[index] as unknown;
  if (node.type === 'paragraph') {
    return (node.children[0] as unknown).value;
  }
  return node.value;
}

describe('katex plugin', () => {
  describe('inline math rendering', () => {
    it('should render inline math correctly', () => {
      const tree = createInlineMathTree('E = mc^2');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
      expect(output).toContain('E');
      expect(output).toContain('mc');
      expect(output).not.toContain('katex-display'); // Should be inline, not display
    });

    it('should handle simple fractions', () => {
      const tree = createInlineMathTree('\\frac{1}{2}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
      expect(output).toContain('frac');
    });

    it('should handle square roots', () => {
      const tree = createInlineMathTree('\\sqrt{x}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
      expect(output).toContain('sqrt');
    });

    it('should handle Greek letters', () => {
      const tree = createInlineMathTree('\\alpha + \\beta = \\gamma');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle subscripts and superscripts', () => {
      const tree = createInlineMathTree('x^2 + y_1');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle basic arithmetic', () => {
      const tree = createInlineMathTree('2 + 2 = 4');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });
  });

  describe('display math rendering', () => {
    it('should render display math correctly', () => {
      const tree = createDisplayMathTree('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
      expect(output).toContain('katex-display');
    });

    it('should handle integrals', () => {
      const tree = createDisplayMathTree('\\int_{-\\infty}^{\\infty} e^{-x^2} dx');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle summations', () => {
      const tree = createDisplayMathTree('\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle matrices', () => {
      const tree = createDisplayMathTree('\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle complex fractions', () => {
      const tree = createDisplayMathTree('\\frac{\\frac{a}{b}}{\\frac{c}{d}}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle limits', () => {
      const tree = createDisplayMathTree('\\lim_{x \\to \\infty} f(x) = L');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle derivatives', () => {
      const tree = createDisplayMathTree('\\frac{d}{dx} x^2 = 2x');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle products', () => {
      const tree = createDisplayMathTree('\\prod_{i=1}^{n} x_i');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });

    it('should handle binomial coefficients', () => {
      const tree = createDisplayMathTree('\\binom{n}{k} = \\frac{n!}{k!(n-k)!}');
      const plugin = katexPlugin();
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
    });
  });

  describe('error handling', () => {
    it('should gracefully handle invalid LaTeX commands', () => {
      const tree = createInlineMathTree('\\invalid{command}');
      const plugin = katexPlugin({ strict: false });
      plugin(tree);

      const output = getHtmlOutput(tree);
      // Should render error message instead of throwing
      expect(output).toBeTruthy();
      // KaTeX renders invalid commands with color or error styling
      expect(output).toContain('katex');
    });

    it('should handle HTML-like characters in LaTeX', () => {
      const tree = createInlineMathTree('<script>alert("xss")</script>');
      const plugin = katexPlugin({ strict: false });
      plugin(tree);

      const output = getHtmlOutput(tree);
      // KaTeX treats these as math symbols, not HTML
      expect(output).toContain('katex');
      // The < and > should be escaped
      expect(output).toContain('&lt;');
    });

    it('should handle empty LaTeX string', () => {
      const tree = createInlineMathTree('');
      const plugin = katexPlugin();

      // Should not throw
      expect(() => plugin(tree)).not.toThrow();
    });

    it('should handle whitespace-only LaTeX', () => {
      const tree = createInlineMathTree('   ');
      const plugin = katexPlugin();

      // Should not throw
      expect(() => plugin(tree)).not.toThrow();
    });
  });

  describe('custom options', () => {
    it('should support custom macros', () => {
      const tree = createInlineMathTree('\\RR \\times \\NN');
      const options: KaTeXOptions = {
        macros: {
          '\\RR': '\\mathbb{R}',
          '\\NN': '\\mathbb{N}',
        },
      };
      const plugin = katexPlugin(options);
      plugin(tree);

      const output = getHtmlOutput(tree);
      expect(output).toContain('katex');
      // Custom macros should be expanded
      expect(output).toContain('mathbb');
    });

    it('should use custom error color', () => {
      const tree = createInlineMathTree('\\invalid');
      const plugin = katexPlugin({ strict: false, errorColor: '#ff0000' });
      plugin(tree);

      const output = getHtmlOutput(tree);
      // Should render with custom error color
      expect(output).toContain('katex');
    });
  });

  describe('multiple math nodes', () => {
    it('should handle multiple math nodes in a tree', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'inlineMath',
            value: 'x^2',
            data: {},
          } as unknown,
          {
            type: 'math',
            value: 'y = mx + b',
            data: {},
          } as unknown,
          {
            type: 'inlineMath',
            value: 'z^3',
            data: {},
          } as unknown,
        ],
      };

      const plugin = katexPlugin();
      plugin(tree);

      // All should be transformed to HTML
      tree.children.forEach((node: unknown) => {
        const nodeObj = node as Record<string, unknown>;
        expect(nodeObj.type).toBe('html');
        expect(String(nodeObj.value)).toContain('katex');
      });
    });

    it('should handle mixed content (text and math)', () => {
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
              } as unknown,
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

      const paragraph = tree.children[0] as unknown;
      const mathNode = paragraph.children[1];

      expect(mathNode.type).toBe('html');
      expect(mathNode.value).toContain('katex');
      expect(mathNode.value).toContain('x');
    });
  });

  describe('edge cases', () => {
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

    it('should not modify non-math nodes', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Plain text',
              },
            ],
          },
          {
            type: 'inlineMath',
            value: 'x^2',
            data: {},
          } as unknown,
        ],
      };

      const plugin = katexPlugin();
      plugin(tree);

      // Text node should remain unchanged
      const paragraph = tree.children[0] as unknown;
      expect(paragraph.type).toBe('paragraph');
      expect(paragraph.children[0].type).toBe('text');
      expect(paragraph.children[0].value).toBe('Plain text');

      // Math node should be transformed
      const mathNode = tree.children[1] as unknown;
      expect(mathNode.type).toBe('html');
    });
  });
});
