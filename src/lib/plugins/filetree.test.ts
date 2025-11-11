/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { filetreePlugin } from './filetree';
import type { Root } from 'mdast';
import * as treeParser from '../utils/tree-parser.js';
import * as base64 from '../utils/base64.js';

describe('filetree plugin', () => {
  const createCodeBlock = (lang: string, value: string): Root => ({
    type: 'root',
    children: [
      {
        type: 'code',
        lang,
        value,
      },
    ],
  });

  it('should transform filetree code blocks to HTML', () => {
    const mockTreeData = {
      name: 'src',
      type: 'directory',
      children: [{ name: 'main.ts', type: 'file' }],
    };

    vi.spyOn(treeParser, 'parseTree').mockReturnValue(mockTreeData);
    vi.spyOn(base64, 'encodeJsonBase64').mockReturnValue('encoded');

    const tree = createCodeBlock('filetree', 'src/\n└── main.ts');
    const plugin = filetreePlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.value).toContain('<div class="md-filetree"');
    expect(htmlNode.value).toContain('data-tree="encoded"');
  });

  it('should parse tree structure', () => {
    const treeString = 'src/\n└── main.ts';
    const mockTreeData = { name: 'src', type: 'directory', children: [] };

    const parseTreeSpy = vi.spyOn(treeParser, 'parseTree').mockReturnValue(mockTreeData);
    vi.spyOn(base64, 'encodeJsonBase64').mockReturnValue('encoded');

    const tree = createCodeBlock('filetree', treeString);
    const plugin = filetreePlugin();
    plugin(tree);

    expect(parseTreeSpy).toHaveBeenCalledWith(treeString);
  });

  it('should encode tree data as base64', () => {
    const mockTreeData = { name: 'root', type: 'directory', children: [] };

    vi.spyOn(treeParser, 'parseTree').mockReturnValue(mockTreeData);
    const encodeJsonBase64Spy = vi.spyOn(base64, 'encodeJsonBase64').mockReturnValue('encoded');

    const tree = createCodeBlock('filetree', 'root/');
    const plugin = filetreePlugin();
    plugin(tree);

    expect(encodeJsonBase64Spy).toHaveBeenCalledWith(mockTreeData);
  });

  it('should not transform non-filetree code blocks', () => {
    const tree = createCodeBlock('javascript', 'console.log("test")');
    const plugin = filetreePlugin();
    plugin(tree);

    const codeNode = tree.children[0] as any;
    expect(codeNode.type).toBe('code');
    expect(codeNode.lang).toBe('javascript');
  });

  it('should render error message on parse failure', () => {
    vi.spyOn(treeParser, 'parseTree').mockImplementation(() => {
      throw new Error('Parse error');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const tree = createCodeBlock('filetree', 'invalid tree');
    const plugin = filetreePlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.value).toContain('md-filetree--error');
    expect(htmlNode.value).toContain('Invalid File Tree');
    expect(htmlNode.value).toContain('Failed to parse file tree structure');
    expect(htmlNode.value).toContain('invalid tree');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should escape HTML in error message', () => {
    vi.spyOn(treeParser, 'parseTree').mockImplementation(() => {
      throw new Error('Parse error');
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const maliciousContent = '<script>alert("XSS")</script>';
    const tree = createCodeBlock('filetree', maliciousContent);
    const plugin = filetreePlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.value).not.toContain('<script>');
    expect(htmlNode.value).toContain('&lt;script&gt;');

    consoleErrorSpy.mockRestore();
  });

  it('should handle complex file trees', () => {
    const complexTree = {
      name: 'project',
      type: 'directory',
      children: [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'index.ts', type: 'file' },
            { name: 'utils.ts', type: 'file' },
          ],
        },
        { name: 'README.md', type: 'file' },
      ],
    };

    vi.spyOn(treeParser, 'parseTree').mockReturnValue(complexTree);
    vi.spyOn(base64, 'encodeJsonBase64').mockReturnValue('complex');

    const tree = createCodeBlock('filetree', 'project/\n├── src/\n└── README.md');
    const plugin = filetreePlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.value).toContain('data-tree="complex"');
  });

  it('should handle multiple filetree blocks', () => {
    const mockTree1 = { name: 'tree1', type: 'directory', children: [] };
    const mockTree2 = { name: 'tree2', type: 'directory', children: [] };

    vi.spyOn(treeParser, 'parseTree').mockReturnValueOnce(mockTree1).mockReturnValueOnce(mockTree2);
    vi.spyOn(base64, 'encodeJsonBase64').mockReturnValueOnce('first').mockReturnValueOnce('second');

    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'filetree',
          value: 'tree1/',
        },
        {
          type: 'code',
          lang: 'filetree',
          value: 'tree2/',
        },
      ],
    };

    const plugin = filetreePlugin();
    plugin(tree);

    const firstNode = tree.children[0] as any;
    const secondNode = tree.children[1] as any;

    expect(firstNode.value).toContain('data-tree="first"');
    expect(secondNode.value).toContain('data-tree="second"');
  });
});
