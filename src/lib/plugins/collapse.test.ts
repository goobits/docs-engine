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

    it('should render code blocks', () => {
      const tree = createCollapseDirective([
        {
          type: 'code',
          lang: 'javascript',
          value: 'console.log("test");',
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<pre><code class="language-javascript">');
      expect(htmlNode.value).toContain('console.log(&quot;test&quot;);');
    });

    it('should render code blocks without language', () => {
      const tree = createCollapseDirective([
        {
          type: 'code',
          value: 'plain code',
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<pre><code>plain code</code></pre>');
    });

    it('should render blockquotes', () => {
      const tree = createCollapseDirective([
        {
          type: 'blockquote',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'Quote text' }],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<blockquote>');
      expect(htmlNode.value).toContain('<p>Quote text</p>');
      expect(htmlNode.value).toContain('</blockquote>');
    });

    it('should render headings', () => {
      const tree = createCollapseDirective([
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Section Title' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<h2>Section Title</h2>');
    });

    it('should render unordered lists', () => {
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
                  children: [{ type: 'text', value: 'Item 1' }],
                },
              ],
            },
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'Item 2' }],
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
      expect(htmlNode.value).toContain('<li>Item 1</li>');
      expect(htmlNode.value).toContain('<li>Item 2</li>');
      expect(htmlNode.value).toContain('</ul>');
    });

    it('should render ordered lists', () => {
      const tree = createCollapseDirective([
        {
          type: 'list',
          ordered: true,
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'First' }],
                },
              ],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<ol>');
      expect(htmlNode.value).toContain('<li>First</li>');
      expect(htmlNode.value).toContain('</ol>');
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
    it('should render emphasis', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Normal ' },
            {
              type: 'emphasis',
              children: [{ type: 'text', value: 'italic' }],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('Normal <em>italic</em>');
    });

    it('should render strong', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            {
              type: 'strong',
              children: [{ type: 'text', value: 'bold' }],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<strong>bold</strong>');
    });

    it('should render inline code', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Use ' },
            { type: 'inlineCode', value: 'console.log()' },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('Use <code>console.log()</code>');
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

    it('should render strikethrough', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [
            {
              type: 'delete',
              children: [{ type: 'text', value: 'deleted' }],
            },
          ],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('<del>deleted</del>');
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

  describe('HTML escaping', () => {
    it('should escape HTML in title', () => {
      const tree = createCollapseDirective(
        [
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Content' }],
          },
        ],
        { title: '<script>alert("XSS")</script>' }
      );

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).not.toContain('<script>');
      expect(htmlNode.value).toContain('&lt;script&gt;');
    });

    it('should escape HTML in content', () => {
      const tree = createCollapseDirective([
        {
          type: 'paragraph',
          children: [{ type: 'text', value: '<img src=x onerror=alert(1)>' }],
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).not.toContain('<img src=x');
      expect(htmlNode.value).toContain('&lt;img');
    });

    it('should escape HTML in code', () => {
      const tree = createCollapseDirective([
        {
          type: 'code',
          value: '<script>alert("test")</script>',
        },
      ]);

      const plugin = collapsePlugin();
      plugin(tree);

      const htmlNode = tree.children[0] as any;
      expect(htmlNode.value).toContain('&lt;script&gt;');
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
