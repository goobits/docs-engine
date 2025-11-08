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

  it('should transform NOTE callout', () => {
    const blockquote = createBlockquote('NOTE');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--blue');
    expect(html).toContain('Note');
  });

  it('should transform TIP callout', () => {
    const blockquote = createBlockquote('TIP');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--green');
    expect(html).toContain('Tip');
  });

  it('should transform WARNING callout', () => {
    const blockquote = createBlockquote('WARNING');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--yellow');
    expect(html).toContain('Warning');
  });

  it('should transform IMPORTANT callout', () => {
    const blockquote = createBlockquote('IMPORTANT');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--purple');
    expect(html).toContain('Important');
  });

  it('should transform CAUTION callout', () => {
    const blockquote = createBlockquote('CAUTION');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--red');
    expect(html).toContain('Caution');
  });

  it('should not transform regular blockquotes', () => {
    const blockquote = createBlockquote();
    const tree = processTree(blockquote);

    // Should still be a blockquote, not transformed
    expect(tree.children[0].type).toBe('blockquote');
  });

  it('should handle SUCCESS callout', () => {
    const blockquote = createBlockquote('SUCCESS');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--success');
    expect(html).toContain('Success');
  });

  it('should handle DANGER callout', () => {
    const blockquote = createBlockquote('DANGER');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--danger');
    expect(html).toContain('Danger');
  });

  it('should handle INFO callout', () => {
    const blockquote = createBlockquote('INFO');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--info');
    expect(html).toContain('Info');
  });

  it('should handle QUESTION callout', () => {
    const blockquote = createBlockquote('QUESTION');
    const tree = processTree(blockquote);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = (tree.children[0] as any).value;
    expect(html).toContain('md-callout--question');
    expect(html).toContain('Question');
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
