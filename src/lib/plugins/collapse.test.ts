/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { collapsePlugin } from './collapse';
import type { Root } from 'mdast';

describe('collapse plugin', () => {
  const createCollapseDirective = (content: any[], attributes?: Record<string, string>): Root => ({
    type: 'root',
    children: [
      {
        type: 'containerDirective' as any,
        name: 'collapse',
        attributes,
        children: content,
      },
    ],
  });

  describe('basic transformation', () => {
    it('should transform collapse directive to details element', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Content here' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.type).toBe('html');
      expect(htmlNode.value).toContain('<details class="md-collapse"');
      expect(htmlNode.value).toContain('<summary class="md-collapse__summary">');
      expect(htmlNode.value).toContain('<p>Content here</p>');
      expect(htmlNode.children).toBeUndefined();
    });

    it('should use custom title from attributes', () => {
      const tree = createCollapseDirective(
        [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Content' }],
          },
        ],
        { title: 'Custom Title' }
      );

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('Custom Title');
    });

    it('should use default title when not specified', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Content' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('Details');
    });

    it('should be open by default', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Content' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<details class="md-collapse" open>');
    });

    it('should be closed when open=false', () => {
      const tree = createCollapseDirective(
        [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Content' }],
          },
        ],
        { open: 'false' }
      );

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<details class="md-collapse" >');
      expect(htmlNode.value).not.toContain('open');
    });

    it('should include chevron icon', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Content' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<svg class="md-collapse__icon"');
      expect(htmlNode.value).toContain('viewBox="0 0 16 16"');
    });
  });

  describe('content rendering', () => {
    it('should render paragraph content', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'First paragraph' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Second paragraph' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<p>First paragraph</p>');
      expect(htmlNode.value).toContain('<p>Second paragraph</p>');
    });

    it.each([
      {
        name: 'code block with language',
        content: { type: 'code', lang: 'javascript', value: 'console.log("test");' },
        expected: ['<pre><code class="language-javascript">', 'console.log(&quot;test&quot;);'],
      },
      {
        name: 'code block without language',
        content: { type: 'code', value: 'plain code' },
        expected: ['<pre><code>plain code</code></pre>'],
      },
      {
        name: 'blockquote',
        content: {
          type: 'blockquote',
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Quote text' }] }],
        },
        expected: ['<blockquote>', '<p>Quote text</p>', '</blockquote>'],
      },
      {
        name: 'heading',
        content: {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Section Title' }],
        },
        expected: ['<h2>Section Title</h2>'],
      },
    ])('should render $name', ({ content, expected }) => {
      const tree = createCollapseDirective([content as any]);
      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expected.forEach((exp) => {
        expect(htmlNode.value).toContain(exp);
      });
    });

    it.each([
      {
        name: 'unordered list',
        ordered: false,
        items: ['Item 1', 'Item 2'],
        expectedTag: 'ul',
      },
      {
        name: 'ordered list',
        ordered: true,
        items: ['First', 'Second'],
        expectedTag: 'ol',
      },
    ])('should render $name', ({ ordered, items, expectedTag }) => {
      const tree = createCollapseDirective([
        {
          type: 'list',
          ordered,
          children: items.map((item) => ({
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: item }],
              },
            ],
          })),
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain(`<${expectedTag}>`);
      items.forEach((item) => {
        expect(htmlNode.value).toContain(`<li>${item}</li>`);
      });
      expect(htmlNode.value).toContain(`</${expectedTag}>`);
    });

    it('should render nested lists', () => {
      const tree = createCollapseDirective([
        {
          type: 'list',
          ordered: false,
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'Parent item' }],
                },
                {
                  type: 'list',
                  ordered: false,
                  children: [
                    {
                      type: 'listItem',
                      children: [
                        {
                          type: 'paragraph',
                          children: [{ type: 'text', value: 'Nested item' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<ul>');
      expect(htmlNode.value).toContain('Parent item');
      expect(htmlNode.value).toContain('Nested item');
    });
  });

  describe('inline content rendering', () => {
    it.each([
      {
        name: 'emphasis',
        children: [
          { type: 'text', value: 'Normal ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'italic' }] },
        ],
        expected: 'Normal <em>italic</em>',
      },
      {
        name: 'strong',
        children: [{ type: 'strong', children: [{ type: 'text', value: 'bold' }] }],
        expected: '<strong>bold</strong>',
      },
      {
        name: 'inline code',
        children: [
          { type: 'text', value: 'Use ' },
          { type: 'inlineCode', value: 'console.log()' },
        ],
        expected: 'Use <code>console.log()</code>',
      },
      {
        name: 'strikethrough',
        children: [{ type: 'delete', children: [{ type: 'text', value: 'deleted' }] }],
        expected: '<del>deleted</del>',
      },
    ])('should render $name', ({ children, expected }) => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: children as any,
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain(expected);
    });

    it('should render links', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://example.com',
              children: [{ type: 'text', value: 'Link text' }],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<a href="https://example.com">Link text</a>');
    });

    it('should render links with title', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url: 'https://example.com',
              title: 'Example Site',
              children: [{ type: 'text', value: 'Link' }],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('title="Example Site"');
    });

    it('should render images', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'image.png',
              alt: 'Alt text',
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<img src="image.png" alt="Alt text">');
    });

    it('should render images with title', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'image.png',
              alt: 'Alt',
              title: 'Image title',
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('title="Image title"');
    });

    it('should render line breaks', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Line 1' },
            { type: 'break' },
            { type: 'text', value: 'Line 2' },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('Line 1<br>Line 2');
    });
  });

  describe('edge cases', () => {
    it('should handle empty collapse directive', () => {
      const tree = createCollapseDirective([]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.type).toBe('html');
      expect(htmlNode.value).toContain('<details');
    });

    it('should handle invalid tree gracefully', () => {
      const tree: Root = {
        type: 'root',
        children: null as any,
      };

      const plugin = collapsePlugin();
      expect(() => plugin(tree)).not.toThrow();
    });

    it('should handle node without name', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'containerDirective' as any,
            children: [],
          },
        ],
      };

      const plugin = collapsePlugin();
      expect(() => plugin(tree)).not.toThrow();
    });

    it('should skip non-collapse directives', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'containerDirective' as any,
            name: 'other',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Content' }],
              },
            ],
          },
        ],
      };

      const plugin = collapsePlugin();
      plugin(tree);

      const node = tree.children[0] as any;
      expect(node.type).toBe('containerDirective');
      expect(node.name).toBe('other');
    });

    it('should sanitize null/undefined children', () => {
      const tree: Root = {
        type: 'root',
        children: [
          {
            type: 'containerDirective' as any,
            name: 'collapse',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: 'Valid' }, null as any, undefined as any],
              },
            ],
          },
        ],
      };

      const plugin = collapsePlugin();
      expect(() => plugin(tree)).not.toThrow();

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('Valid');
    });
  });
});
