// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sharp from 'sharp';
import { existsSync, mkdirSync, rmSync, statSync, utimesSync } from 'fs';
import { join } from 'path';
import { processImage, batchProcessImages } from './image-processor.js';

// Behavior-focused integration tests for the Sharp-backed image processor.
//
// NOTE on temp-dir location: processImage() runs validatePath() against
// process.cwd() as the allowed base directory (path-traversal protection), so
// the input image MUST live inside the repo working directory or the call
// throws "Path traversal detected". We therefore root everything under cwd,
// mirroring the existing file-io.test.ts convention.

const ROOT = join(process.cwd(), 'test-image-processor-temp');
const INPUT_DIR = join(ROOT, 'input');
const OUTPUT_DIR = join(ROOT, 'output');
const CACHE_DIR = join(ROOT, 'cache');

const ORIG_WIDTH = 400;
const ORIG_HEIGHT = 300;
const inputPath = join(INPUT_DIR, 'sample.png');

async function cleanRoot(): Promise<void> {
  // batchProcessImages() runs configs via Promise.all; when one config rejects,
  // a sibling config can still be mid-write (an orphaned async write) as the
  // test completes. Retry the recursive removal so any late write that lands
  // after the first sweep is mopped up too.
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!existsSync(ROOT)) return;
    rmSync(ROOT, { recursive: true, force: true });
    if (!existsSync(ROOT)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

beforeAll(async () => {
  await cleanRoot();
  mkdirSync(INPUT_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(CACHE_DIR, { recursive: true });

  // Generate a tiny real PNG so Sharp has genuine pixel data to work with.
  await sharp({
    create: {
      width: ORIG_WIDTH,
      height: ORIG_HEIGHT,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  })
    .png()
    .toFile(inputPath);
});

afterAll(async () => {
  // Guarded cleanup so a partial/failed setup never throws here.
  await cleanRoot();
});

describe('processImage', () => {
  it('reports original dimensions and generates variants for each format x size', async () => {
    const outDir = join(OUTPUT_DIR, 'basic');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      formats: ['webp', 'png'],
      sizes: [200],
      quality: { webp: 80, png: 80 },
    });

    // Result echoes the ORIGINAL image dimensions, not the resized variant.
    expect(result.width).toBe(ORIG_WIDTH);
    expect(result.height).toBe(ORIG_HEIGHT);

    // 2 formats x 1 size = 2 variants.
    expect(result.variants).toHaveLength(2);

    const formats = result.variants.map((v) => v.format).sort();
    expect(formats).toEqual(['png', 'webp']);

    // Every reported variant must describe a file that really exists on disk,
    // with the requested width and a positive byte size.
    for (const variant of result.variants) {
      expect(variant.width).toBe(200);
      expect(variant.height).toBeGreaterThan(0);
      expect(variant.size).toBeGreaterThan(0);
      expect(existsSync(variant.path)).toBe(true);
      expect(statSync(variant.path).size).toBe(variant.size);
    }
  });

  it('writes variant files whose real on-disk dimensions match the request', async () => {
    const outDir = join(OUTPUT_DIR, 'on-disk');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      formats: ['webp', 'png'],
      sizes: [200],
      quality: { webp: 80, png: 80 },
    });

    for (const variant of result.variants) {
      const meta = await sharp(variant.path).metadata();
      // fit: 'inside' resize to width 200 on a 400x300 source -> 200x150.
      expect(meta.width).toBe(200);
      expect(meta.height).toBe(150);
      // The actual encoded format on disk matches the reported variant format.
      expect(meta.format).toBe(variant.format);
    }
  });

  it('uses a predictable "<basename>-<width>w.<format>" output filename', async () => {
    const outDir = join(OUTPUT_DIR, 'naming');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      formats: ['webp'],
      sizes: [200],
      quality: { webp: 80 },
    });

    expect(result.variants[0].path).toBe(join(outDir, 'sample-200w.webp'));
    expect(existsSync(join(outDir, 'sample-200w.webp'))).toBe(true);
  });

  it('skips sizes larger than the original (withoutEnlargement)', async () => {
    const outDir = join(OUTPUT_DIR, 'skip-larger');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      // 200 <= 400 original width -> kept; 800 > 400 -> skipped entirely.
      formats: ['webp'],
      sizes: [200, 800],
      quality: { webp: 80 },
    });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].width).toBe(200);
    expect(existsSync(join(outDir, 'sample-800w.webp'))).toBe(false);
  });

  it('generates an LQIP placeholder when requested', async () => {
    const outDir = join(OUTPUT_DIR, 'placeholder');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      formats: ['webp'],
      sizes: [200],
      quality: { webp: 80 },
      generatePlaceholder: true,
    });

    expect(result.placeholder).toBe(join(outDir, 'sample-placeholder.jpg'));
    expect(existsSync(result.placeholder!)).toBe(true);

    // Placeholder is a tiny (40px wide) JPEG blur.
    const meta = await sharp(result.placeholder!).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBe(40);
  });

  it('omits the placeholder when not requested', async () => {
    const outDir = join(OUTPUT_DIR, 'no-placeholder');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      formats: ['webp'],
      sizes: [200],
      quality: { webp: 80 },
    });

    expect(result.placeholder).toBeUndefined();
    expect(existsSync(join(outDir, 'sample-placeholder.jpg'))).toBe(false);
  });

  it('resolves "original" to the source format', async () => {
    const outDir = join(OUTPUT_DIR, 'original-format');
    const result = await processImage({
      inputPath,
      outputDir: outDir,
      formats: ['original'],
      sizes: [200],
      quality: {},
    });

    // Source is PNG, so the 'original' variant is reported/encoded as png.
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].format).toBe('png');
    expect(result.variants[0].path).toBe(join(outDir, 'sample-200w.png'));
    const meta = await sharp(result.variants[0].path).metadata();
    expect(meta.format).toBe('png');
  });

  it('throws when the input image does not exist', async () => {
    await expect(
      processImage({
        inputPath: join(INPUT_DIR, 'does-not-exist.png'),
        outputDir: join(OUTPUT_DIR, 'missing'),
        formats: ['webp'],
        sizes: [200],
        quality: { webp: 80 },
      })
    ).rejects.toThrow(/Input image not found/);
  });

  it('throws on path traversal outside the working directory', async () => {
    await expect(
      processImage({
        inputPath: '/etc/passwd',
        outputDir: join(OUTPUT_DIR, 'traversal'),
        formats: ['webp'],
        sizes: [200],
        quality: { webp: 80 },
      })
    ).rejects.toThrow(/Path traversal detected/);
  });
});

describe('processImage caching', () => {
  it('returns a consistent result on a second (cache-hit) run with cacheDir set', async () => {
    const outDir = join(OUTPUT_DIR, 'cache-run');
    const config = {
      inputPath,
      outputDir: outDir,
      formats: ['webp' as const, 'png' as const],
      sizes: [200],
      quality: { webp: 80, png: 80 },
      generatePlaceholder: true,
      cacheDir: CACHE_DIR,
    };

    const first = await processImage(config);

    // Force the cached outputs to look "fresh" (mtime >= input mtime) so the
    // isCacheValid() branch is exercised deterministically regardless of
    // sub-second filesystem timestamp granularity.
    const future = new Date(Date.now() + 60_000);
    for (const variant of first.variants) {
      utimesSync(variant.path, future, future);
    }
    utimesSync(first.placeholder!, future, future);

    const second = await processImage(config);

    // Cache hit must yield an equivalent result shape.
    expect(second.width).toBe(first.width);
    expect(second.height).toBe(first.height);
    expect(second.variants).toHaveLength(first.variants.length);

    const byPath = (vs: typeof second.variants): typeof second.variants =>
      [...vs].sort((a, b) => a.path.localeCompare(b.path));
    const firstSorted = byPath(first.variants);
    const secondSorted = byPath(second.variants);

    for (let i = 0; i < secondSorted.length; i++) {
      expect(secondSorted[i].path).toBe(firstSorted[i].path);
      expect(secondSorted[i].format).toBe(firstSorted[i].format);
      expect(secondSorted[i].width).toBe(firstSorted[i].width);
      expect(secondSorted[i].height).toBe(firstSorted[i].height);
      // Reading dimensions back off the cached file stays consistent.
      const meta = await sharp(secondSorted[i].path).metadata();
      expect(meta.width).toBe(secondSorted[i].width);
    }

    // The placeholder file is preserved across the cached run.
    expect(second.placeholder).toBe(first.placeholder);
    expect(existsSync(second.placeholder!)).toBe(true);
  });
});

describe('batchProcessImages', () => {
  it('processes multiple configs and returns a result per config', async () => {
    const results = await batchProcessImages([
      {
        inputPath,
        outputDir: join(OUTPUT_DIR, 'batch-a'),
        formats: ['webp'],
        sizes: [200],
        quality: { webp: 80 },
      },
      {
        inputPath,
        outputDir: join(OUTPUT_DIR, 'batch-b'),
        formats: ['png'],
        sizes: [200],
        quality: { png: 80 },
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].variants[0].format).toBe('webp');
    expect(results[1].variants[0].format).toBe('png');
    expect(existsSync(join(OUTPUT_DIR, 'batch-a', 'sample-200w.webp'))).toBe(true);
    expect(existsSync(join(OUTPUT_DIR, 'batch-b', 'sample-200w.png'))).toBe(true);
  });

  it('rejects if any image in the batch fails', async () => {
    await expect(
      batchProcessImages([
        {
          inputPath,
          outputDir: join(OUTPUT_DIR, 'batch-ok'),
          formats: ['webp'],
          sizes: [200],
          quality: { webp: 80 },
        },
        {
          inputPath: join(INPUT_DIR, 'missing-in-batch.png'),
          outputDir: join(OUTPUT_DIR, 'batch-fail'),
          formats: ['webp'],
          sizes: [200],
          quality: { webp: 80 },
        },
      ])
    ).rejects.toThrow();

    // batchProcessImages uses Promise.all, so it rejects as soon as the missing
    // input fails while the sibling "batch-ok" write may still be in flight.
    // Let that orphaned write settle here so afterAll cleanup is deterministic.
    await new Promise((r) => setTimeout(r, 100));
  });
});
