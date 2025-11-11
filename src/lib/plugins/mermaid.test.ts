/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { mermaidPlugin } from './mermaid';
import type { Root } from 'mdast';
import * as base64 from '../utils/base64.js';

describe('mermaid plugin', () => {
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

  it('should transform mermaid code blocks to HTML', () => {
    vi.spyOn(base64, 'encodeBase64').mockReturnValue('ZW5jb2RlZA==');

    const tree = createCodeBlock('mermaid', 'graph TD\n  A --> B');
    const plugin = mermaidPlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.value).toContain('<div class="md-mermaid"');
    expect(htmlNode.value).toContain('data-diagram="ZW5jb2RlZA=="');
  });

  it('should encode diagram content', () => {
    const encodeBase64Spy = vi.spyOn(base64, 'encodeBase64').mockReturnValue('encoded');

    const diagram = 'graph LR\n  Start --> End';
    const tree = createCodeBlock('mermaid', diagram);
    const plugin = mermaidPlugin();
    plugin(tree);

    expect(encodeBase64Spy).toHaveBeenCalledWith(diagram);
  });

  it('should not transform non-mermaid code blocks', () => {
    const tree = createCodeBlock('javascript', 'console.log("test")');
    const plugin = mermaidPlugin();
    plugin(tree);

    const codeNode = tree.children[0] as any;
    expect(codeNode.type).toBe('code');
    expect(codeNode.lang).toBe('javascript');
    expect(codeNode.value).toBe('console.log("test")');
  });

  it('should handle complex mermaid diagrams', () => {
    vi.spyOn(base64, 'encodeBase64').mockReturnValue('complex');

    const complexDiagram = `
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: Great!
    `;

    const tree = createCodeBlock('mermaid', complexDiagram);
    const plugin = mermaidPlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.value).toContain('data-diagram="complex"');
  });

  it('should handle empty mermaid blocks', () => {
    vi.spyOn(base64, 'encodeBase64').mockReturnValue('empty');

    const tree = createCodeBlock('mermaid', '');
    const plugin = mermaidPlugin();
    plugin(tree);

    const htmlNode = tree.children[0] as any;
    expect(htmlNode.type).toBe('html');
    expect(htmlNode.value).toContain('md-mermaid');
  });

  it('should handle multiple mermaid blocks', () => {
    vi.spyOn(base64, 'encodeBase64').mockReturnValueOnce('first').mockReturnValueOnce('second');

    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'mermaid',
          value: 'graph TD\n  A --> B',
        },
        {
          type: 'code',
          lang: 'mermaid',
          value: 'graph LR\n  C --> D',
        },
      ],
    };

    const plugin = mermaidPlugin();
    plugin(tree);

    const firstNode = tree.children[0] as any;
    const secondNode = tree.children[1] as any;

    expect(firstNode.value).toContain('data-diagram="first"');
    expect(secondNode.value).toContain('data-diagram="second"');
  });
});
