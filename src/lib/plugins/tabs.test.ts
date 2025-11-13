/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { tabsPlugin } from './tabs';
import type { Root, Code } from 'mdast';
import { decodeJsonBase64 } from '../utils/base64';

interface Tab {
  label: string;
  content: string;
  language?: string;
}

describe('tabs plugin', () => {
  const createCodeBlock = (lang: string, value: string): Root => ({
    type: 'root',
    children: [
      {
        type: 'code',
        lang,
        value,
      } as Code,
    ],
  });

  describe('plugin basic functionality', () => {
    it('should export tabsPlugin function', () => {
      expect(tabsPlugin).toBeDefined();
      expect(typeof tabsPlugin).toBe('function');
    });

    it('should return transformer function', () => {
      const plugin = tabsPlugin();
      expect(typeof plugin).toBe('function');
    });

    it('should transform tabs code blocks', () => {
      const tree = createCodeBlock(
        'tabs:example',
        `tab: JavaScript
---
\`\`\`js
console.log('test');
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.type).toBe('html');
      expect(htmlNode.value).toContain('md-code-tabs');
    });

    it('should skip non-tabs code blocks', () => {
      const tree = createCodeBlock('javascript', 'console.log("test");');

      const plugin = tabsPlugin();
      plugin(tree);

      const node = tree.children[0] as any;
      expect(node.type).toBe('code');
      expect(node.lang).toBe('javascript');
    });

    it('should preserve non-tabs nodes', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Normal text' }],
          },
        ],
      };

      const plugin = tabsPlugin();
      plugin(tree);

      expect(tree.children[0].type).toBe('paragraph');
    });
  });

  describe('tab parsing', () => {
    it('should parse single tab', () => {
      const tree = createCodeBlock(
        'tabs:single',
        `tab: JavaScript
---
\`\`\`js
const x = 1;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs).toHaveLength(1);
      expect(tabs[0].label).toBe('JavaScript');
      expect(tabs[0].content).toBe('const x = 1;');
      expect(tabs[0].language).toBe('js');
    });

    it('should parse multiple tabs', () => {
      const tree = createCodeBlock(
        'tabs:multi',
        `tab: JavaScript
---
\`\`\`js
const x = 1;
\`\`\`
---
tab: TypeScript
---
\`\`\`ts
const x: number = 1;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs).toHaveLength(2);
      expect(tabs[0].label).toBe('JavaScript');
      expect(tabs[1].label).toBe('TypeScript');
    });

    it('should extract tab labels', () => {
      const tree = createCodeBlock(
        'tabs:labels',
        `tab: My Custom Label
---
\`\`\`js
code;
\`\`\`
---
tab: Another Label
---
\`\`\`js
more code;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].label).toBe('My Custom Label');
      expect(tabs[1].label).toBe('Another Label');
    });

    it('should extract code content', () => {
      const tree = createCodeBlock(
        'tabs:content',
        `tab: Example
---
\`\`\`js
const data = await fetch('/api');
const json = await data.json();
console.log(json);
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].content).toContain('const data = await fetch');
      expect(tabs[0].content).toContain('const json = await data.json()');
      expect(tabs[0].content).toContain('console.log(json)');
    });

    it('should detect language from code fences', () => {
      const tree = createCodeBlock(
        'tabs:lang',
        `tab: Python
---
\`\`\`python
print("Hello")
\`\`\`
---
tab: Ruby
---
\`\`\`ruby
puts "Hello"
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].language).toBe('python');
      expect(tabs[1].language).toBe('ruby');
    });

    it('should handle tabs without language', () => {
      const tree = createCodeBlock(
        'tabs:nolang',
        `tab: Plain
---
\`\`\`
plain text
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].language).toBeUndefined();
      expect(tabs[0].content).toBe('plain text');
    });

    it('should handle separators (---)', () => {
      const tree = createCodeBlock(
        'tabs:sep',
        `tab: First
---
\`\`\`js
first;
\`\`\`
---
tab: Second
---
\`\`\`js
second;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs).toHaveLength(2);
      expect(tabs[0].content).toBe('first;');
      expect(tabs[1].content).toBe('second;');
    });

    it('should trim whitespace', () => {
      const tree = createCodeBlock(
        'tabs:trim',
        `tab:   Spaced Label
---
\`\`\`js
  const x = 1;
  const y = 2;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].label).toBe('Spaced Label');
      // Content should preserve internal spacing but trim overall
      expect(tabs[0].content).toContain('const x = 1;');
    });

    it('should handle empty tabs (skip them)', () => {
      const tree = createCodeBlock(
        'tabs:empty',
        `tab: Empty
---
\`\`\`js
\`\`\`
---
tab: Valid
---
\`\`\`js
code;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      // Empty tab should be skipped
      expect(tabs).toHaveLength(1);
      expect(tabs[0].label).toBe('Valid');
    });

    it('should handle missing labels (skip them)', () => {
      const tree = createCodeBlock(
        'tabs:nolabel',
        `\`\`\`js
orphan code;
\`\`\`
---
tab: Valid
---
\`\`\`js
valid code;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      // Only the tab with a label should be included
      expect(tabs).toHaveLength(1);
      expect(tabs[0].label).toBe('Valid');
    });
  });

  describe('HTML generation', () => {
    it('should generate div with correct class', () => {
      const tree = createCodeBlock(
        'tabs:class',
        `tab: Test
---
\`\`\`js
test;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('class="md-code-tabs"');
    });

    it('should include tabs-id attribute', () => {
      const tree = createCodeBlock(
        'tabs:my-custom-id',
        `tab: Test
---
\`\`\`js
test;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('data-tabs-id="my-custom-id"');
    });

    it('should include base64-encoded data-tabs attribute', () => {
      const tree = createCodeBlock(
        'tabs:encoded',
        `tab: JavaScript
---
\`\`\`js
const x = 1;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toMatch(/data-tabs="[A-Za-z0-9+/=]+"/);

      // Verify it can be decoded
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs[0].label).toBe('JavaScript');
    });

    it('should escape HTML in tabs-id', () => {
      const tree = createCodeBlock(
        'tabs:<script>alert("xss")</script>',
        `tab: Test
---
\`\`\`js
test;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('&lt;script&gt;');
      expect(htmlNode.value).toContain('&lt;/script&gt;');
      expect(htmlNode.value).not.toContain('<script>');
    });

    it('should transform Code node to HTML node', () => {
      const tree = createCodeBlock(
        'tabs:transform',
        `tab: Test
---
\`\`\`js
test;
\`\`\``
      );

      const codeNode = tree.children[0];
      expect(codeNode.type).toBe('code');

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.type).toBe('html');
      expect(typeof htmlNode.value).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle empty code block', () => {
      const tree = createCodeBlock('tabs:empty', '');

      const plugin = tabsPlugin();
      plugin(tree);

      // Should remain as code block since no valid tabs
      const node = tree.children[0] as any;
      expect(node.type).toBe('code');
    });

    it('should handle malformed tab syntax', () => {
      const tree = createCodeBlock(
        'tabs:malformed',
        `not a tab
\`\`\`js
code;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      // Should remain as code block since no valid tabs
      const node = tree.children[0] as any;
      expect(node.type).toBe('code');
    });

    it('should handle tabs without code blocks', () => {
      const tree = createCodeBlock(
        'tabs:nocode',
        `tab: NoCode
---
just plain text
---
tab: AlsoNoCode
---
more plain text`
      );

      const plugin = tabsPlugin();
      plugin(tree);

      // Should remain as code block since no valid code blocks
      const node = tree.children[0] as any;
      expect(node.type).toBe('code');
    });

    it('should handle multiple code blocks in one tab', () => {
      const tree = createCodeBlock(
        'tabs:multi-code',
        `tab: Multiple
---
\`\`\`js
const x = 1;
\`\`\`
\`\`\`js
const y = 2;
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      // Only the first code block should be captured
      expect(tabs).toHaveLength(1);
      expect(tabs[0].content).toContain('const x = 1;');
      expect(tabs[0].content).toContain('const y = 2;');
    });

    it('should handle special characters in labels', () => {
      const tree = createCodeBlock(
        'tabs:special',
        `tab: C++ & "Quotes" <Tags>
---
\`\`\`cpp
int main() {}
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].label).toBe('C++ & "Quotes" <Tags>');
    });

    it('should handle code with indentation', () => {
      const tree = createCodeBlock(
        'tabs:indent',
        `tab: Indented
---
\`\`\`js
function example() {
  if (true) {
    return "nested";
  }
}
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].content).toContain('function example()');
      expect(tabs[0].content).toContain('  if (true)');
      expect(tabs[0].content).toContain('    return "nested"');
    });

    it('should handle tabs with complex language identifiers', () => {
      const tree = createCodeBlock(
        'tabs:complex-lang',
        `tab: Bash
---
\`\`\`bash
#!/bin/bash
echo "test"
\`\`\`
---
tab: Diff
---
\`\`\`diff
+ added line
- removed line
\`\`\``
      );

      const plugin = tabsPlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      const dataTabs = htmlNode.value.match(/data-tabs="([^"]+)"/)?.[1];
      const tabs = decodeJsonBase64<Tab[]>(dataTabs);

      expect(tabs[0].language).toBe('bash');
      expect(tabs[1].language).toBe('diff');
    });

    it('should handle empty tree gracefully', () => {
      const tree: Root = {
        type: 'root',
        children: [],
      };

      const plugin = tabsPlugin();
      expect(() => plugin(tree)).not.toThrow();
    });

    it('should not transform tabs with only whitespace', () => {
      const tree = createCodeBlock('tabs:whitespace', '   \n\n   ');

      const plugin = tabsPlugin();
      plugin(tree);

      // Should remain as code block
      const node = tree.children[0] as any;
      expect(node.type).toBe('code');
    });
  });
});
