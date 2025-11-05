# Image Optimization

Automatic image optimization with modern formats, responsive images, lazy loading, and click-to-zoom.

## Features

- ✅ **Multiple Formats** - Auto-generate WebP and AVIF with fallbacks
- ✅ **Responsive Images** - Generate multiple sizes with srcset
- ✅ **Lazy Loading** - IntersectionObserver-based lazy loading
- ✅ **Blur Placeholder** - LQIP (Low Quality Image Placeholder) for smooth loading
- ✅ **Click-to-Zoom** - Full-size lightbox modal
- ✅ **Automatic Optimization** - Works at build time, zero configuration

## Quick Start

### 1. Install Package

```bash
pnpm add @goobits/docs-engine
```

### 2. Add Plugin to Your Config

```typescript
// svelte.config.js or mdsvex.config.js
import { imageOptimizationPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        imageOptimizationPlugin({
          formats: ['webp', 'avif', 'original'],
          sizes: [640, 960, 1280, 1920],
          lazy: true,
          zoom: true,
          placeholder: 'blur'
        })
      ]
    })
  ]
};
```

### 3. Add Hydrator to Your Layout

```svelte
<!-- +layout.svelte -->
<script>
  import { OptimizedImageHydrator } from '@goobits/docs-engine/components';
</script>

<slot />
<OptimizedImageHydrator />
```

### 4. Use in Markdown

```markdown
<!-- Simple -->
![Dashboard screenshot](./dashboard.png)

<!-- With dimensions -->
![Logo](./logo.svg?width=200&height=100)

<!-- With title/caption -->
![Chart](./chart.png "Monthly sales trends")
```

## Configuration

### Plugin Options

```typescript
interface ImageOptimizationOptions {
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
```

### Default Configuration

```typescript
const defaults = {
  basePath: '/images',
  formats: ['webp', 'avif', 'original'],
  sizes: [640, 960, 1280, 1920],
  quality: {
    webp: 85,
    avif: 80,
    jpg: 85,
    png: 100
  },
  lazy: true,
  zoom: true,
  placeholder: 'blur',
  skipExternal: true
};
```

## Build-Time Image Processing

To optimize images at build time, use the image processor service:

```typescript
// scripts/optimize-images.ts
import { processImage } from '@goobits/docs-engine/server';

const result = await processImage({
  inputPath: './docs/images/screenshot.png',
  outputDir: './static/images/optimized',
  formats: ['webp', 'avif', 'original'],
  sizes: [640, 960, 1280, 1920],
  quality: { webp: 85, avif: 80 },
  generatePlaceholder: true
});

console.log('Generated variants:', result.variants);
console.log('Placeholder:', result.placeholder);
```

### Batch Processing

```typescript
import { batchProcessImages } from '@goobits/docs-engine/server';
import { glob } from 'glob';

// Find all images in docs
const images = await glob('docs/**/*.{png,jpg,jpeg}');

// Process all images
const results = await batchProcessImages(
  images.map((img) => ({
    inputPath: img,
    outputDir: './static/images/optimized',
    formats: ['webp', 'avif', 'original'],
    sizes: [640, 960, 1280, 1920],
    quality: { webp: 85, avif: 80 },
    generatePlaceholder: true
  }))
);

console.log(`Optimized ${results.length} images`);
```

## Advanced Usage

### Custom Formats

Generate only WebP and original:

```typescript
imageOptimizationPlugin({
  formats: ['webp', 'original']
})
```

### Mobile-First Sizes

```typescript
imageOptimizationPlugin({
  sizes: [375, 768, 1024, 1440] // iPhone, iPad, desktop
})
```

### Disable Lazy Loading

```typescript
imageOptimizationPlugin({
  lazy: false, // Load all images immediately
  placeholder: 'none'
})
```

### High-Quality Images

```typescript
imageOptimizationPlugin({
  quality: {
    webp: 95,
    avif: 90,
    jpg: 95,
    png: 100
  }
})
```

### Process External URLs

By default, external images (http://, https://) are skipped:

```typescript
imageOptimizationPlugin({
  skipExternal: false // Optimize external images too
})
```

## Image Syntax

### Basic Image

```markdown
![Alt text](./image.png)
```

### With Title/Caption

```markdown
![Alt text](./image.png "This becomes the caption")
```

### With Dimensions

```markdown
![Logo](./logo.svg?width=200&height=100)
```

Dimensions are extracted from the URL and the clean URL is used for optimization.

### External Images

```markdown
![CDN Image](https://cdn.example.com/image.jpg)
```

External images are passed through unless `skipExternal: false`.

## Generated HTML

The plugin transforms markdown images into optimized `<picture>` elements:

```html
<figure class="optimized-image-container">
  <picture>
    <!-- AVIF (best compression) -->
    <source
      type="image/avif"
      srcset="/images/photo-640w.avif 640w,
              /images/photo-960w.avif 960w,
              /images/photo-1280w.avif 1280w"
      sizes="(max-width: 640px) 100vw, (max-width: 960px) 90vw, 1280px"
    />

    <!-- WebP (wide support) -->
    <source
      type="image/webp"
      srcset="/images/photo-640w.webp 640w,
              /images/photo-960w.webp 960w,
              /images/photo-1280w.webp 1280w"
      sizes="(max-width: 640px) 100vw, (max-width: 960px) 90vw, 1280px"
    />

    <!-- Original format (fallback) -->
    <img
      src="/images/photo-640w.jpg"
      alt="Photo description"
      loading="lazy"
      class="optimized-image zoomable"
    />
  </picture>
  <figcaption>Photo caption</figcaption>
</figure>
```

## Features Explained

### 1. Multiple Formats

Modern formats (WebP, AVIF) provide 30-50% better compression than JPEG/PNG:

- **AVIF**: Best compression, newer browsers
- **WebP**: Great compression, wide support
- **Original**: Fallback for older browsers

Browsers automatically choose the best format they support.

### 2. Responsive Images

Different image sizes for different screen sizes:

```html
srcset="/img-640w.webp 640w,
        /img-960w.webp 960w,
        /img-1280w.webp 1280w"
```

- Mobile (375-640px): Loads 640px version
- Tablet (768-960px): Loads 960px version
- Desktop (1024+): Loads 1280px version

Saves bandwidth on mobile devices!

### 3. Lazy Loading

Images below the fold are loaded only when scrolled into view:

- Uses IntersectionObserver (native browser API)
- Starts loading 50px before image enters viewport
- Dramatically improves initial page load time

### 4. Blur Placeholder (LQIP)

A tiny, blurred version (40px wide) loads first:

- 1-2KB size (loads instantly)
- Smooth blur-to-sharp transition
- Better perceived performance

### 5. Click-to-Zoom

Click any image to view full-size in a lightbox:

- Keyboard navigation (Escape to close)
- Backdrop click to close
- Shows image caption
- Smooth animations

## Performance Benefits

### Before

```
Original PNG: 2.4 MB
Load time: 3.2s on 3G
Lighthouse: 65
```

### After

```
AVIF 1280px: 180 KB (92% reduction!)
Load time: 0.4s on 3G (8x faster)
Lighthouse: 95
```

### Typical Savings

- **JPEG → WebP**: 30-40% smaller
- **PNG → WebP**: 50-60% smaller
- **WebP → AVIF**: 20-30% smaller
- **Lazy loading**: 40-60% faster initial load

## Lighthouse Impact

Image optimization directly improves Core Web Vitals:

- ✅ **LCP** (Largest Contentful Paint) - Faster image loading
- ✅ **CLS** (Cumulative Layout Shift) - Dimensions prevent layout shift
- ✅ **FCP** (First Contentful Paint) - Smaller images load faster

Expected Lighthouse improvements:
- Performance: +15-30 points
- Best Practices: +5-10 points

## Browser Support

| Format | Support | Fallback |
|--------|---------|----------|
| AVIF | Chrome 85+, Firefox 93+, Safari 16+ | WebP → Original |
| WebP | 95% of browsers | Original format |
| Original | 100% | Always works |

The `<picture>` element ensures all users get optimized images.

## CSS Customization

Customize the look in your global CSS:

```css
/* Image container */
.optimized-image-container {
  margin: 2rem auto;
  max-width: 100%;
}

/* Image styling */
.optimized-image {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Loading state */
.optimized-image:not(.loaded) {
  filter: blur(20px);
}

/* Loaded state */
.optimized-image.loaded {
  filter: none;
  transition: filter 0.3s ease;
}

/* Caption */
.image-caption {
  font-size: 0.875rem;
  color: #666;
  text-align: center;
  margin-top: 0.5rem;
}

/* Lightbox */
.image-lightbox {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
}
```

## Troubleshooting

### Images not optimizing

**Check:**
1. Plugin is added to `remarkPlugins` array
2. Hydrator component is in your layout
3. Image paths are correct
4. Build process ran successfully

### Blur placeholder not working

Set `generatePlaceholder: true` in build-time processing:

```typescript
await processImage({
  inputPath: './image.png',
  outputDir: './static/images',
  generatePlaceholder: true // ← Enable LQIP
});
```

### External images not loading

External images are skipped by default. Enable with:

```typescript
imageOptimizationPlugin({
  skipExternal: false
})
```

### Zoom not working

Ensure hydrator is present and JavaScript is enabled:

```svelte
<OptimizedImageHydrator />
```

## Best Practices

### 1. Use Appropriate Formats

- **Photos**: JPEG → WebP → AVIF
- **Graphics/UI**: PNG → WebP
- **Logos**: SVG (no optimization needed)
- **Icons**: SVG or inline SVG

### 2. Choose Optimal Sizes

Match your content width:

```typescript
// For 800px content width
sizes: [400, 800, 1600] // 1x, 2x, 3x for retina
```

### 3. Optimize Quality

Balance size vs. quality:

- **Hero images**: 90-95 quality
- **Content images**: 80-85 quality
- **Thumbnails**: 70-80 quality

### 4. Alt Text

Always provide descriptive alt text:

```markdown
✅ ![Dashboard showing monthly sales trends](./dashboard.png)
❌ ![Screenshot](./screenshot.png)
```

### 5. File Organization

```
docs/
  images/
    screenshots/
      dashboard.png
      profile.png
    diagrams/
      architecture.svg
static/
  images/
    optimized/  ← Generated files go here
```

## API Reference

### Plugin

```typescript
import { imageOptimizationPlugin } from '@goobits/docs-engine/plugins';
```

### Components

```typescript
import {
  OptimizedImage,
  OptimizedImageHydrator
} from '@goobits/docs-engine/components';
```

### Server Functions

```typescript
import {
  processImage,
  batchProcessImages
} from '@goobits/docs-engine/server';
```

### Types

```typescript
import type {
  ImageOptimizationOptions,
  ImageMetadata,
  ImageProcessorConfig,
  ImageProcessorResult,
  ImageVariant
} from '@goobits/docs-engine';
```

## Examples

See the [examples directory](../examples) for complete examples:

- Basic setup
- Custom configuration
- Build-time processing
- Advanced usage

## Related

- [Proposal #10 - Image Optimization](../proposals/10_image_optimization.proposal.md)
- [Screenshot Plugin](./SCREENSHOTS.md)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
