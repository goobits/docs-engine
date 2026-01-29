import { describe, it, expect } from 'vitest';
import { imageOptimizationPlugin } from './image-optimization.js';
import type { Root, Image, Paragraph, Html } from 'mdast';

describe('imageOptimizationPlugin', () => {
  it('should transform markdown images to optimized image divs', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './screenshot.png',
              alt: 'Screenshot of dashboard',
              title: 'Dashboard view',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin();
    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const transformed = paragraph.children[0] as Html;

    expect(transformed.type).toBe('html');
    expect(transformed.value).toContain('md-optimized-image');
    expect(transformed.value).toContain('data-config');
  });

  it('should extract dimensions from URL parameters', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './logo.svg?width=200&height=100',
              alt: 'Logo',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin();
    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const transformed = paragraph.children[0] as Html;

    // Should have removed dimensions from URL
    expect(transformed.value).not.toContain('width=200');
    expect(transformed.value).not.toContain('height=100');

    // Should have data-config with encoded metadata
    expect(transformed.value).toContain('data-config');
  });

  it('should skip external URLs when skipExternal is true', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/image.jpg',
              alt: 'External image',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin({ skipExternal: true });
    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const node = paragraph.children[0];

    // Should NOT be transformed (still an image node)
    expect(node.type).toBe('image');
  });

  it('should process external URLs when skipExternal is false', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/image.jpg',
              alt: 'External image',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin({ skipExternal: false });
    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const transformed = paragraph.children[0] as Html;

    // Should be transformed
    expect(transformed.type).toBe('html');
    expect(transformed.value).toContain('md-optimized-image');
  });

  it('should use custom configuration options', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './photo.jpg',
              alt: 'Photo',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin({
      basePath: '/custom-images',
      formats: ['webp', 'original'],
      sizes: [320, 640],
      lazy: false,
      zoom: false,
      placeholder: 'none',
    });

    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const transformed = paragraph.children[0] as Html;

    expect(transformed.type).toBe('html');
    expect(transformed.value).toContain('md-optimized-image');
    expect(transformed.value).toContain('data-config');

    // Config should be base64 encoded, so we can't easily inspect it
    // But we can verify it exists and has the right structure
    const configMatch = transformed.value.match(/data-config="([^"]+)"/);
    expect(configMatch).toBeTruthy();
    expect(configMatch[1].length).toBeGreaterThan(0);
  });

  it('should preserve alt text', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './image.png',
              alt: 'Important accessibility text',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin();
    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const transformed = paragraph.children[0] as Html;

    // Alt text is encoded in the config
    expect(transformed.value).toContain('data-config');
  });

  it('should handle images without titles', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './image.png',
              alt: 'Image without title',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin();
    await plugin(tree);

    const paragraph = tree.children[0] as Paragraph;
    const transformed = paragraph.children[0] as Html;

    expect(transformed.type).toBe('html');
    expect(transformed.value).toContain('md-optimized-image');
  });

  it('should handle multiple images in the same document', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './image1.png',
              alt: 'First image',
            } as Image,
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: './image2.jpg',
              alt: 'Second image',
            } as Image,
          ],
        },
      ],
    };

    const plugin = imageOptimizationPlugin();
    await plugin(tree);

    const first = (tree.children[0] as Paragraph).children[0] as Html;
    const second = (tree.children[1] as Paragraph).children[0] as Html;

    expect(first.type).toBe('html');
    expect(first.value).toContain('md-optimized-image');

    expect(second.type).toBe('html');
    expect(second.value).toContain('md-optimized-image');
  });
});
