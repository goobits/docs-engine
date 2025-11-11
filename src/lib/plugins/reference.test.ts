/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { referencePlugin } from './reference';
import type { Root } from 'mdast';
import * as symbolResolver from '../utils/symbol-resolver.js';
import * as symbolRenderer from '../utils/symbol-renderer.js';

describe('reference plugin', () => {
  // Mock symbol map and related functions
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSymbolMap = new Map([
    [
      'MyFunction',
      {
        id: 'MyFunction',
        name: 'MyFunction',
        kind: 'function' as const,
        signature: 'function MyFunction(): void',
        filePath: 'src/utils.ts',
        line: 10,
        jsDoc: {
          description: 'A test function',
          tags: [],
          params: [],
        },
      },
    ],
    [
      'MyType',
      {
        id: 'MyType',
        name: 'MyType',
        kind: 'type' as const,
        signature: 'type MyType = string',
        filePath: 'src/types.ts',
        line: 5,
      },
    ],
  ]);

  // Helper to create a simple text node in a paragraph
  const createTextNode = (value: string): Root => ({
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value }],
      },
    ],
  });

  // Helper to create a reference block directive
  const createReferenceBlock = (symbolName: string, attributes?: Record<string, string>): Root => ({
    type: 'root',
    children: [
      {
        type: 'containerDirective' as any,
        name: 'reference',
        attributes,
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: symbolName }],
          },
        ],
      },
    ],
  });

  describe('inline references', () => {
    it('should transform {@SymbolName} to a link node', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });
      vi.spyOn(symbolRenderer, 'symbolToGitHubUrl').mockReturnValue(
        'https://github.com/user/repo/blob/main/src/utils.ts#L10'
      );

      const tree = createTextNode('Check out {@MyFunction} for more info');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(3);
      expect(paragraph.children[0].type).toBe('text');
      expect(paragraph.children[0].value).toBe('Check out ');
      expect(paragraph.children[1].type).toBe('link');
      expect(paragraph.children[1].url).toContain('github.com');
      expect(paragraph.children[1].children[0].value).toBe('MyFunction');
      expect(paragraph.children[2].type).toBe('text');
      expect(paragraph.children[2].value).toBe(' for more info');
    });

    it('should handle multiple inline references in one text node', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });
      vi.spyOn(symbolRenderer, 'symbolToGitHubUrl').mockReturnValue('https://github.com/test');

      const tree = createTextNode('Use {@MyFunction} with {@MyType} for best results');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(5);
      expect(paragraph.children[0].value).toBe('Use ');
      expect(paragraph.children[1].type).toBe('link');
      expect(paragraph.children[2].value).toBe(' with ');
      expect(paragraph.children[3].type).toBe('link');
      expect(paragraph.children[4].value).toBe(' for best results');
    });

    it('should create warning node for unresolved inline reference', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation(() => {
        throw new Error('Symbol not found');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const tree = createTextNode('Check {@UnknownSymbol}');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(2);
      expect(paragraph.children[1].type).toBe('html');
      expect(paragraph.children[1].value).toContain('symbol-ref-error');
      expect(paragraph.children[1].value).toContain('UnknownSymbol');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should skip processing if symbol map fails to load', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockImplementation(() => {
        throw new Error('Symbol map not found');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const tree = createTextNode('Check {@MyFunction}');
      const plugin = referencePlugin();
      plugin(tree);

      // Tree should be unchanged
      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(1);
      expect(paragraph.children[0].value).toBe('Check {@MyFunction}');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Symbol map not loaded:',
        expect.stringContaining('Symbol map not found')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not process text without references', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);

      const tree = createTextNode('Regular text without references');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(1);
      expect(paragraph.children[0].value).toBe('Regular text without references');
    });
  });

  describe('block references', () => {
    it('should transform :::reference block to HTML', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });
      vi.spyOn(symbolRenderer, 'renderBlock').mockReturnValue(
        '<div class="symbol-block">MyFunction docs</div>'
      );

      const tree = createReferenceBlock('MyFunction');
      const plugin = referencePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.type).toBe('html');
      expect(htmlNode.value).toContain('symbol-block');
      expect(htmlNode.value).toContain('MyFunction docs');
      expect(htmlNode.children).toBeUndefined();
      expect(htmlNode.name).toBeUndefined();
    });

    it('should pass render options from attributes', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });

      const renderBlockSpy = vi
        .spyOn(symbolRenderer, 'renderBlock')
        .mockReturnValue('<div>HTML</div>');

      const tree = createReferenceBlock('MyFunction', { show: 'params,returns' });
      const plugin = referencePlugin();
      plugin(tree);

      expect(renderBlockSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          show: ['params', 'returns'],
        })
      );
    });

    it('should create warning block for unresolved reference', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation(() => {
        throw new Error('Symbol not found');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const tree = createReferenceBlock('UnknownSymbol');
      const plugin = referencePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.type).toBe('html');
      expect(htmlNode.value).toContain('symbol-ref-block-error');
      expect(htmlNode.value).toContain('UnknownSymbol');
      expect(htmlNode.value).toContain('Symbol not found');
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML in warning messages', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation(() => {
        throw new Error('Error with <script>alert("XSS")</script>');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const tree = createTextNode('Check {@BadSymbol}');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children[1].value).not.toContain('<script>');
      expect(paragraph.children[1].value).toContain('&lt;script&gt;');

      consoleWarnSpy.mockRestore();
    });

    it('should escape HTML in block warning messages', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation(() => {
        throw new Error('Error with <img src=x onerror=alert(1)>');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const tree = createReferenceBlock('BadSymbol');
      const plugin = referencePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).not.toContain('<img');
      expect(htmlNode.value).toContain('&lt;img');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('tree sanitization', () => {
    it('should remove null/undefined children from tree', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);

      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: 'Hello' },
              null as any,
              { type: 'text', value: 'World' },
              undefined as any,
            ],
          },
        ],
      };

      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(2);
      expect(paragraph.children[0].value).toBe('Hello');
      expect(paragraph.children[1].value).toBe('World');
    });
  });

  describe('edge cases', () => {
    it('should handle empty reference block', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);

      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'containerDirective' as any,
            name: 'reference',
            children: [],
          },
        ],
      };

      const plugin = referencePlugin();

      // Should throw error for missing symbol name
      expect(() => plugin(tree)).toThrow(':::reference directive requires a symbol name');
    });

    it('should handle reference block with non-text content', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);

      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'containerDirective' as any,
            name: 'reference',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'emphasis', children: [{ type: 'text', value: 'MyFunction' }] }],
              },
            ],
          },
        ],
      };

      const plugin = referencePlugin();

      // Should not find symbol reference in non-text node
      expect(() => plugin(tree)).toThrow(':::reference directive requires a symbol name');
    });

    it('should use JSDoc description for tooltip', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });
      vi.spyOn(symbolRenderer, 'symbolToGitHubUrl').mockReturnValue('https://github.com/test');

      const tree = createTextNode('See {@MyFunction}');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      const link = paragraph.children[1];
      expect(link.title).toBe('A test function');
    });

    it('should fallback to signature for tooltip when no JSDoc', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });
      vi.spyOn(symbolRenderer, 'symbolToGitHubUrl').mockReturnValue('https://github.com/test');

      const tree = createTextNode('See {@MyType}');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      const link = paragraph.children[1];
      expect(link.title).toBe('type MyType = string');
    });

    it('should handle consecutive inline references', () => {
      vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(mockSymbolMap);
      vi.spyOn(symbolResolver, 'resolveSymbol').mockImplementation((ref, map) => {
        const symbol = map.get(ref);
        if (!symbol) throw new Error(`Symbol ${ref} not found`);
        return symbol;
      });
      vi.spyOn(symbolRenderer, 'symbolToGitHubUrl').mockReturnValue('https://github.com/test');

      const tree = createTextNode('{@MyFunction}{@MyType}');
      const plugin = referencePlugin();
      plugin(tree);

      const paragraph = tree.children[0] as any;
      expect(paragraph.children.length).toBe(2);
      expect(paragraph.children[0].type).toBe('link');
      expect(paragraph.children[1].type).toBe('link');
    });
  });
});
