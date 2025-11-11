import { describe, it, expect } from 'vitest';
import { calloutsPlugin } from './callouts';
import type { Root } from 'mdast';

describe('callouts plugin', () => {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const createBlockquote = (type?: string, customTitle?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    if (type) {
      // First paragraph with the marker
      const markerText = customTitle ? `[!${type}] ${customTitle}` : `[!${type}]`;
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', value: markerText }],
      });

      // Second paragraph with content
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', value: 'Some content here' }],
      });
    } else {
      // Regular blockquote
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', value: 'Regular quote' }],
      });
    }

    return {
      type: 'blockquote',
      children,
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processTree = (node: any): Root => {
    const tree: Root = {
      type: 'root',
      children: [node],
    };
    const plugin = calloutsPlugin();
    plugin(tree);
    return tree;
  };

  // Test all callout types with parameterized tests
  const calloutTypes = [
    { type: 'NOTE', cssClass: 'blue', title: 'Note' },
    { type: 'TIP', cssClass: 'green', title: 'Tip' },
    { type: 'WARNING', cssClass: 'yellow', title: 'Warning' },
    { type: 'IMPORTANT', cssClass: 'purple', title: 'Important' },
    { type: 'CAUTION', cssClass: 'red', title: 'Caution' },
    { type: 'SUCCESS', cssClass: 'success', title: 'Success' },
    { type: 'DANGER', cssClass: 'danger', title: 'Danger' },
    { type: 'INFO', cssClass: 'info', title: 'Info' },
    { type: 'QUESTION', cssClass: 'question', title: 'Question' },
  ];

  it.each(calloutTypes)(
    'should transform $type callout with correct class and title',
    ({ type, cssClass, title }) => {
      const blockquote = createBlockquote(type);
      const tree = processTree(blockquote);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html = (tree.children[0] as any).value;
      expect(html).toContain(`md-callout--${cssClass}`);
      expect(html).toContain(title);
    }
  );

  it('should not transform regular blockquotes', () => {
    const blockquote = createBlockquote();
    const tree = processTree(blockquote);

    // Should still be a blockquote, not transformed
    expect(tree.children[0].type).toBe('blockquote');
  });

  it('should preserve ARIA attributes', () => {
    const blockquote = createBlockquote('NOTE');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-label');
  });

  it('should not transform invalid callout types', () => {
    const blockquote = createBlockquote('INVALID');
    const tree = processTree(blockquote);

    // Should not be transformed
    expect(tree.children[0].type).toBe('blockquote');
  });

  it('should handle custom titles', () => {
    const blockquote = createBlockquote('NOTE', 'Custom Title');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('Custom Title');
  });
});
