# Image Optimization

## Problem

Documentation images are often:
- Unoptimized (large PNG/JPG files)
- Not responsive (same size for all devices)
- Not lazy loaded (slow initial page load)
- Missing modern formats (WebP/AVIF)
- No zoom/lightbox functionality

This results in slow page loads, poor mobile experience, and high bandwidth usage.

## Solution

Automatic image optimization pipeline that generates responsive images with modern formats, lazy loading, and interactive features.

**Features:**
- Auto-generate WebP/AVIF with fallbacks
- Responsive images with srcset
- Lazy loading with blur-up placeholder
- Click to zoom (lightbox)
- Captions from alt text
- Automatic optimization at build time

## Checklists

### Image Processing
- [ ] Use Sharp for image processing
- [ ] Generate WebP versions of all images
- [ ] Generate AVIF versions (optional, configurable)
- [ ] Generate multiple sizes (small, medium, large, original)
- [ ] Generate low-quality image placeholder (LQIP)
- [ ] Preserve original format as fallback
- [ ] Cache processed images

### Markdown Plugin
- [ ] Create `imageOptimizationPlugin` remark plugin
- [ ] Detect markdown images `![alt](src)`
- [ ] Transform to optimized image component
- [ ] Pass dimensions, srcset, LQIP to component
- [ ] Support image attributes (width, height, loading)
- [ ] Handle relative and absolute paths

### Image Component
- [ ] Create `OptimizedImage.svelte` component
- [ ] Render `<picture>` with multiple sources
- [ ] Support WebP, AVIF, and original format
- [ ] Generate srcset for responsive images
- [ ] Implement lazy loading with IntersectionObserver
- [ ] Show LQIP blur placeholder while loading
- [ ] Add click-to-zoom functionality
- [ ] Support captions (from alt or title attribute)

### Lightbox/Zoom
- [ ] Create `ImageLightbox.svelte` component
- [ ] Open full-size image on click
- [ ] Keyboard navigation (arrows, escape)
- [ ] Touch gestures for mobile (pinch, swipe)
- [ ] Show caption in lightbox
- [ ] Smooth open/close animations
- [ ] Close on backdrop click

### Build-time Processing
- [ ] Scan all markdown files for images
- [ ] Process images during build
- [ ] Write optimized images to output directory
- [ ] Generate metadata JSON (dimensions, formats, sizes)
- [ ] Skip re-processing unchanged images
- [ ] Show progress during build

### Configuration
- [ ] Add `imageConfig` to docs-engine config
- [ ] Support `formats` (webp, avif, jpg, png)
- [ ] Support `sizes` array for responsive images
- [ ] Support `quality` per format
- [ ] Support `lazy` loading toggle
- [ ] Support `zoom` on click toggle
- [ ] Support `placeholder` type (blur, dominant-color, none)

### Styling
- [ ] Style image containers
- [ ] Style captions
- [ ] Style LQIP blur effect
- [ ] Style lightbox overlay and controls
- [ ] Ensure responsive on all screen sizes
- [ ] Dark mode support

### Performance
- [ ] Lazy load images below the fold
- [ ] Preload critical images above the fold
- [ ] Use loading="lazy" attribute
- [ ] Defer JavaScript for lightbox until needed
- [ ] Optimize bundle size (tree-shake unused features)

### External Images
- [ ] Support external image URLs (https://)
- [ ] Option to download and optimize external images
- [ ] Or pass through without optimization
- [ ] Configure via allowlist/denylist

### Documentation
- [ ] Document image optimization in README.md
- [ ] Document supported formats
- [ ] Document configuration options
- [ ] Document markdown image syntax
- [ ] Show before/after file sizes
- [ ] Document lightbox keyboard shortcuts

## Success Criteria

- All markdown images are automatically optimized
- Multiple formats (WebP, AVIF) with fallbacks generated
- Responsive images with srcset for different screen sizes
- Lazy loading works with LQIP blur effect
- Click to zoom opens full-size image in lightbox
- Build time processes images efficiently
- Page load speed improves by 40%+
- Lighthouse performance score 90+
- Works with static and dynamic images

## Benefits

- Faster page load times (40-60% reduction)
- Better mobile experience with responsive images
- Modern image formats reduce bandwidth
- Professional image viewing with zoom
- Automatic optimization (no manual work)
- Improved Lighthouse scores
- Better UX with blur-up placeholder
- Competitive with modern documentation tools
