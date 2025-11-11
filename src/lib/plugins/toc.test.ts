/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { remarkTableOfContents } from './toc';
import type { Root, Heading, List, ListItem } from 'mdast';

describe('toc plugin', () => {
  const createTree = (children: any[]): Root => ({
    type: 'root',
    children,
  });

  const createHeading = (depth: 1 | 2 | 3 | 4 | 5 | 6, text: string): Heading => ({
    type: 'heading',
    depth,
    children: [{ type: 'text', value: text }],
  });

  const createParagraph = (
    text: string
  ): { type: string; children: { type: string; value: string }[] } => ({
    type: 'paragraph',
    children: [{ type: 'text', value: text }],
  });

  describe('plugin basic functionality', () => {
    it('should export remarkTableOfContents function', () => {
      expect(remarkTableOfContents).toBeDefined();
      expect(typeof remarkTableOfContents).toBe('function');
    });

    it('should return transformer function', () => {
      const plugin = remarkTableOfContents();
      expect(typeof plugin).toBe('function');
    });

    it('should not modify tree without TOC marker', () => {
      const tree = createTree([
        createHeading(1, 'Title'),
        createHeading(2, 'Section 1'),
        createParagraph('Content here'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      expect(tree.children).toHaveLength(3);
      expect(tree.children[0].type).toBe('heading');
      expect(tree.children[1].type).toBe('heading');
      expect(tree.children[2].type).toBe('paragraph');
    });

    it('should preserve non-heading nodes', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createParagraph('This is a paragraph'),
        createHeading(2, 'Section 1'),
        createParagraph('Section content'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const paragraphs = tree.children.filter((node) => node.type === 'paragraph');
      expect(paragraphs).toHaveLength(2);
    });
  });

  describe('TOC marker detection', () => {
    it('should detect ## TOC marker', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Section 1')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      // TOC marker should be replaced with "Table of Contents" heading
      const firstHeading = tree.children[0] as Heading;
      expect(firstHeading.type).toBe('heading');
      expect(firstHeading.children[0]).toEqual({ type: 'text', value: 'Table of Contents' });
    });

    it('should detect TOC:2 with depth', () => {
      const tree = createTree([
        createHeading(2, 'TOC:2'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      // Should have TOC heading and list
      expect(tree.children[0].type).toBe('heading');
      expect(tree.children[1].type).toBe('list');

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(1); // Only h2, not h3
    });

    it('should detect TOC:3 with depth 3', () => {
      const tree = createTree([
        createHeading(2, 'TOC:3'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection'),
        createHeading(4, 'Deep section'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      // Should include h2 with nested h3, but not h4
      expect(list.children).toHaveLength(1);
      const firstItem = list.children[0] as ListItem;
      expect(firstItem.children).toHaveLength(2); // paragraph + nested list
    });

    it("should use marker's heading level", () => {
      const tree = createTree([createHeading(3, 'TOC'), createHeading(2, 'Section 1')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const tocHeading = tree.children[0] as Heading;
      expect(tocHeading.depth).toBe(3); // Same as marker level
    });

    it('should default to depth 2 if not specified', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(1); // Only h2 included by default
    });

    it('should handle TOC:0 (include all levels)', () => {
      const tree = createTree([
        createHeading(2, 'TOC:0'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection'),
        createHeading(4, 'Deep section'),
        createHeading(5, 'Very deep'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      // Should include all heading levels
      expect(list.children).toHaveLength(1);
      const firstItem = list.children[0] as ListItem;
      expect(firstItem.children.length).toBeGreaterThan(1); // Has nested lists
    });

    it('should only process headings after TOC marker', () => {
      const tree = createTree([
        createHeading(2, 'Before TOC'),
        createHeading(2, 'TOC'),
        createHeading(2, 'After TOC'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[2] as List;
      expect(list.children).toHaveLength(1);

      const link = (list.children[0] as any).children[0].children[0];
      expect(link.children[0].value).toBe('After TOC');
    });
  });

  describe('TOC generation', () => {
    it('should generate "Table of Contents" heading', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Section 1')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const tocHeading = tree.children[0] as Heading;
      expect(tocHeading.type).toBe('heading');
      expect(tocHeading.children[0]).toEqual({ type: 'text', value: 'Table of Contents' });
    });

    it('should create nested list structure', () => {
      const tree = createTree([
        createHeading(2, 'TOC:3'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection 1.1'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.type).toBe('list');
      expect(list.ordered).toBe(false);
      expect(list.children).toHaveLength(1);

      const firstItem = list.children[0] as ListItem;
      expect(firstItem.type).toBe('listItem');
      expect(firstItem.children).toHaveLength(2); // paragraph + nested list

      const nestedList = firstItem.children[1] as List;
      expect(nestedList.type).toBe('list');
      expect(nestedList.children).toHaveLength(1);
    });

    it('should generate links to headings', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Section 1')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      const listItem = list.children[0] as ListItem;
      const paragraph = listItem.children[0] as any;
      const link = paragraph.children[0];

      expect(link.type).toBe('link');
      expect(link.url).toBe('#section-1');
      expect(link.children[0]).toEqual({ type: 'text', value: 'Section 1' });
    });

    it('should add ID attributes to headings', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Section 1')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      expect(heading.data).toBeDefined();
      expect(heading.data?.hProperties).toEqual({ id: 'section-1' });
    });

    it('should respect depth limit (e.g., TOC:2 only includes h2)', () => {
      const tree = createTree([
        createHeading(2, 'TOC:2'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection'),
        createHeading(2, 'Section 2'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(2); // Only two h2 headings
    });

    it('should handle multiple levels of nesting', () => {
      const tree = createTree([
        createHeading(2, 'TOC:0'),
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection 1.1'),
        createHeading(4, 'Sub-subsection 1.1.1'),
        createHeading(2, 'Section 2'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(2); // Two h2 sections

      const firstItem = list.children[0] as ListItem;
      expect(firstItem.children.length).toBeGreaterThan(1); // Has nested content

      const nestedList = firstItem.children[1] as List;
      expect(nestedList.children).toHaveLength(1); // One h3

      const deeplyNestedItem = nestedList.children[0] as ListItem;
      expect(deeplyNestedItem.children.length).toBeGreaterThan(1); // Has deeper nesting
    });

    it('should handle empty TOC (no headings)', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createParagraph('Just content, no headings'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.type).toBe('list');
      expect(list.children).toHaveLength(0);
    });

    it('should replace TOC marker with TOC content', () => {
      const tree = createTree([
        createHeading(1, 'Document Title'),
        createHeading(2, 'TOC'),
        createHeading(2, 'Section 1'),
      ]);

      const originalLength = tree.children.length;
      const plugin = remarkTableOfContents();
      plugin(tree);

      // TOC marker is replaced with heading + list, so same length
      expect(tree.children.length).toBe(originalLength + 1);
      expect(tree.children[1].type).toBe('heading');
      expect((tree.children[1] as Heading).children[0]).toEqual({
        type: 'text',
        value: 'Table of Contents',
      });
      expect(tree.children[2].type).toBe('list');
    });
  });

  describe('ID generation', () => {
    it('should convert text to lowercase', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'UPPERCASE HEADING')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      expect(heading.data?.hProperties).toEqual({ id: 'uppercase-heading' });
    });

    it('should replace spaces with hyphens', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Multiple Word Heading')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      expect(heading.data?.hProperties).toEqual({ id: 'multiple-word-heading' });
    });

    it('should remove special characters', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createHeading(2, 'Section #1: Hello! (World)'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      expect(heading.data?.hProperties).toEqual({ id: 'section-1-hello-world' });
    });

    it('should handle multiple spaces/hyphens', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createHeading(2, 'Multiple   Spaces   Here'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      expect(heading.data?.hProperties).toEqual({ id: 'multiple-spaces-here' });
    });

    it('should trim leading/trailing hyphens', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createHeading(2, '---Leading and Trailing---'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      const id = heading.data?.hProperties?.id as string;
      expect(id).not.toMatch(/^-/);
      expect(id).not.toMatch(/-$/);
      expect(id).toBe('leading-and-trailing');
    });

    it('should handle Unicode characters', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Café ñoño')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const heading = tree.children[2] as Heading;
      expect(heading.data?.hProperties).toEqual({ id: 'caf-o-o' });
    });
  });

  describe('edge cases', () => {
    it('should handle no headings after TOC marker', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createParagraph('Content without headings'),
        createParagraph('More content'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.type).toBe('list');
      expect(list.children).toHaveLength(0);
    });

    it('should handle single heading', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, 'Only One Section')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(1);

      const listItem = list.children[0] as ListItem;
      const link = (listItem.children[0] as any).children[0];
      expect(link.children[0].value).toBe('Only One Section');
    });

    it('should handle non-sequential heading levels (h2, h4, h2)', () => {
      const tree = createTree([
        createHeading(2, 'TOC:0'),
        createHeading(2, 'Section 1'),
        createHeading(4, 'Skipped h3'),
        createHeading(2, 'Section 2'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(2);

      const firstItem = list.children[0] as ListItem;
      expect(firstItem.children).toHaveLength(2); // paragraph + nested list

      const nestedList = firstItem.children[1] as List;
      expect(nestedList.children).toHaveLength(1); // h4 nested under h2
    });

    it('should handle duplicate heading text (same IDs)', () => {
      const tree = createTree([
        createHeading(2, 'TOC'),
        createHeading(2, 'Section'),
        createHeading(2, 'Section'),
        createHeading(2, 'Section'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(3);

      // All should have the same ID (plugin doesn't handle uniqueness)
      const headings = [tree.children[2], tree.children[3], tree.children[4]] as Heading[];
      headings.forEach((heading) => {
        expect(heading.data?.hProperties).toEqual({ id: 'section' });
      });
    });

    it('should handle empty heading text', () => {
      const tree = createTree([createHeading(2, 'TOC'), createHeading(2, '')]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(1);

      const heading = tree.children[2] as Heading;
      expect(heading.data?.hProperties).toEqual({ id: '' });
    });

    it('should handle very deep nesting', () => {
      const tree = createTree([
        createHeading(2, 'TOC:0'),
        createHeading(2, 'Level 2'),
        createHeading(3, 'Level 3'),
        createHeading(4, 'Level 4'),
        createHeading(5, 'Level 5'),
        createHeading(6, 'Level 6'),
      ]);

      const plugin = remarkTableOfContents();
      plugin(tree);

      const list = tree.children[1] as List;
      expect(list.children).toHaveLength(1);

      // Verify deep nesting structure exists
      let currentItem = list.children[0] as ListItem;
      for (let i = 0; i < 4; i++) {
        expect(currentItem.children.length).toBeGreaterThan(1);
        const nestedList = currentItem.children[1] as List;
        expect(nestedList.type).toBe('list');
        expect(nestedList.children.length).toBeGreaterThan(0);
        currentItem = nestedList.children[0] as ListItem;
      }
    });
  });
});
