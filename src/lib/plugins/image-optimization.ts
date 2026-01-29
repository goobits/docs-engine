import { visit } from 'unist-util-visit';
import type { Root, Image } from 'mdast';
import { encodeJsonBase64 } from '../utils/base64.js';

/**
 * Configuration for image optimization plugin
 *
 * @public
 */
export interface ImageOptimizationOptions {
  /** Base path for optimized images (default: '/images') */
  basePath?: string;
  /** Image formats to generate (default: ['webp', 'avif', 'original']) */
  formats?: Array<'webp' | 'avif' | 'jpg' | 'png' | 'original'>;
  /** Responsive image sizes to generate (default: [640, 960, 1280, 1920]) */
  sizes?: number[];
  /** Quality settings per format (default: { webp: 85, avif: 80, jpg: 85, png: 100 }) */
  quality?: Partial<Record<'webp' | 'avif' | 'jpg' | 'png', number>>;
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Enable click-to-zoom (default: true) */
  zoom?: boolean;
  /** Placeholder type: 'blur', 'dominant-color', 'none' (default: 'blur') */
  placeholder?: 'blur' | 'dominant-color' | 'none';
  /** Skip optimization for external URLs (default: true) */
  skipExternal?: boolean;
}

/**
 * Image metadata for optimization
 *
 * @public
 */
export interface ImageMetadata {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  isExternal: boolean;
}

/**
 * Optimized image configuration passed to component
 *
 * @internal
 */
interface OptimizedImageConfig extends ImageMetadata {
  basePath: string;
  formats: string[];
  sizes: number[];
  quality: Record<string, number>;
  lazy: boolean;
  zoom: boolean;
  placeholder: string;
}

/**
 * Check if URL is external (http://, https://, //)
 * Module-private helper
 */
function isExternalUrl(url: string): boolean {
  // Use explicit alternation to avoid nested optional quantifiers
  return /^(?:https:\/\/|http:\/\/|\/\/)/.test(url);
}

/**
 * Extract dimensions from image URL if present
 * Supports syntax like: image.png?width=800&height=600
 * Module-private helper
 */
function extractDimensions(url: string): { width?: number; height?: number } {
  const urlObj = new URL(url, 'http://dummy.com');
  const width = urlObj.searchParams.get('width');
  const height = urlObj.searchParams.get('height');

  return {
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
  };
}

/**
 * Clean URL by removing dimension query parameters
 * Module-private helper
 */
function cleanUrl(url: string): string {
  if (!url.includes('?')) return url;

  const urlObj = new URL(url, 'http://dummy.com');
  urlObj.searchParams.delete('width');
  urlObj.searchParams.delete('height');

  const cleanPath = urlObj.pathname + (urlObj.search || '');
  return cleanPath.replace(/^\/?/, ''); // Remove leading slash from pathname
}

/**
 * Remark plugin for automatic image optimization
 *
 * Transforms markdown images into optimized images with:
 * - Multiple formats (WebP, AVIF)
 * - Responsive sizes with srcset
 * - Lazy loading with blur placeholder
 * - Click-to-zoom functionality
 *
 * Usage:
 * ```markdown
 * ![Screenshot of dashboard](./dashboard.png)
 * ![Logo](./logo.svg?width=200&height=100)
 * ```
 *
 * Configuration:
 * ```typescript
 * import { imageOptimizationPlugin } from '@goobits/docs-engine/plugins';
 *
 * remarkPlugins: [
 *   imageOptimizationPlugin({
 *     formats: ['webp', 'avif', 'original'],
 *     sizes: [640, 960, 1280, 1920],
 *     lazy: true,
 *     zoom: true
 *   })
 * ]
 * ```
 *
 * @param options - Image optimization configuration
 * @returns Remark transformer function
 *
 * @public
 */
export function imageOptimizationPlugin(options: ImageOptimizationOptions = {}) {
  const basePath = options.basePath || '/images';
  const formats = options.formats || ['webp', 'avif', 'original'];
  const sizes = options.sizes || [640, 960, 1280, 1920];
  const quality = {
    webp: 85,
    avif: 80,
    jpg: 85,
    png: 100,
    ...options.quality,
  };
  const lazy = options.lazy !== false;
  const zoom = options.zoom !== false;
  const placeholder = options.placeholder || 'blur';
  const skipExternal = options.skipExternal !== false;

  return (tree: Root): void => {
    visit(tree, 'image', (node: Image) => {
      const src = node.url;
      const alt = node.alt || '';
      const title = node.title || undefined;

      // Skip external URLs if configured
      const isExternal = isExternalUrl(src);
      if (isExternal && skipExternal) {
        return;
      }

      // Extract dimensions from URL parameters
      const dimensions = extractDimensions(src);
      const cleanSrc = cleanUrl(src);

      // Build metadata object
      const metadata: ImageMetadata = {
        src: cleanSrc,
        alt,
        title,
        width: dimensions.width,
        height: dimensions.height,
        isExternal,
      };

      // Build config for component
      const config: OptimizedImageConfig = {
        ...metadata,
        basePath,
        formats,
        sizes,
        quality,
        lazy,
        zoom,
        placeholder,
      };

      // Encode config as base64 for hydration
      const encodedConfig = encodeJsonBase64(config);

      // Transform to HTML div that will be hydrated
      const htmlNode = node as unknown as Record<string, unknown>;
      htmlNode.type = 'html';
      htmlNode.value = `<div class="md-optimized-image" data-config="${encodedConfig}"></div>`;
      delete htmlNode.url;
      delete htmlNode.alt;
      delete htmlNode.title;
    });
  };
}
