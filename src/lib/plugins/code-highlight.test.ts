import { describe, it, expect } from 'vitest';
import { codeHighlightPlugin, type CodeBlockMetadata } from './code-highlight';
import type { Root, Html } from 'mdast';

/**
 * Tests for code-highlight plugin
 *
 * Note: Internal helper functions are now truly module-private (not exported).
 * These tests focus on the public plugin API, demonstrating that we test
 * behavior, not implementation details. This is the modern approach to privacy.
 *
 * The helpers (parseCodeMetadata, parseLineRange, etc.) are tested indirectly
 * through the plugin's transformation behavior.
 */

describe('code-highlight plugin', () => {
  describe('plugin API', () => {
    it('should export codeHighlightPlugin function', () => {
      expect(typeof codeHighlightPlugin).toBe('function');
    });

    it('should accept options and return a transformer', () => {
      const plugin = codeHighlightPlugin({ theme: 'dracula' });
      expect(typeof plugin).toBe('function');
    });

    it('should work with default options', () => {
      const plugin = codeHighlightPlugin();
      expect(typeof plugin).toBe('function');
    });
  });

  describe('code block transformation', () => {
    it('should transform basic code blocks', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'typescript',
            value: 'const x = 1;',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin({ theme: 'dracula' });
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.type).toBe('html');
      expect(transformed.value).toContain('shiki');
    });

    it('should handle custom language syntax', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'javascript',
            value: 'console.log("test");',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin();
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.type).toBe('html');
      expect(transformed.value).toContain('shiki');
    });

    it('should skip custom plugin languages', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'filetree',
            value: 'src/\n  index.ts',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin();
      await plugin(tree);

      const node = tree.children[0] as Html;
      // Should not transform filetree blocks
      expect(node.type).toBe('code');
      expect(node.lang).toBe('filetree');
    });
  });

  describe('metadata parsing (tested through behavior)', () => {
    it('should parse and apply title attribute', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'typescript title="app.ts"',
            value: 'const x = 1;',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin();
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.value).toContain('code-block-title');
      expect(transformed.value).toContain('app.ts');
    });

    it('should parse and apply line numbers', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'typescript showLineNumbers',
            value: 'const x = 1;\nconst y = 2;',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 4, column: 4, offset: 30 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin();
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.value).toContain('code-block-line-numbers');
      expect(transformed.value).toContain('line-number');
    });

    it('should handle diff language', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'diff',
            value: '+ added line\n- removed line',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 4, column: 4, offset: 30 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin();
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.value).toContain('diff-add');
      expect(transformed.value).toContain('diff-remove');
    });
  });

  describe('options handling', () => {
    it('should respect showLineNumbers option', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'typescript',
            value: 'const x = 1;',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin({ showLineNumbers: true });
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.value).toContain('code-block-line-numbers');
    });

    it('should respect theme option', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'typescript',
            value: 'const x = 1;',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin({ theme: 'dracula' });
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      expect(transformed.value).toContain('shiki');
    });
  });

  describe('error handling', () => {
    it('should handle invalid language gracefully', async () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'code',
            lang: 'nonexistentlanguage123',
            value: 'const x = 1;',
            position: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 3, column: 4, offset: 20 },
            },
          } as unknown,
        ],
      };

      const plugin = codeHighlightPlugin();
      await plugin(tree);

      const transformed = tree.children[0] as Html;
      // Should still transform to HTML, even if highlighting fails
      expect(transformed.type).toBe('html');
    });
  });

  describe('TypeScript types', () => {
    it('should export CodeBlockMetadata interface', () => {
      const metadata: CodeBlockMetadata = {
        language: 'typescript',
        raw: 'typescript',
      };

      expect(metadata.language).toBe('typescript');
    });
  });
});
