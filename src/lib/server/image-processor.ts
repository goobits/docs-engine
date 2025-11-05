import sharp from 'sharp';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, extname, basename } from 'path';

/**
 * Image processing configuration
 *
 * @public
 */
export interface ImageProcessorConfig {
	/** Input image path */
	inputPath: string;
	/** Output directory for optimized images */
	outputDir: string;
	/** Formats to generate */
	formats: Array<'webp' | 'avif' | 'jpg' | 'png' | 'original'>;
	/** Sizes to generate (widths in pixels) */
	sizes: number[];
	/** Quality settings per format */
	quality: Record<string, number>;
	/** Generate LQIP placeholder */
	generatePlaceholder?: boolean;
	/** Cache directory for processed images */
	cacheDir?: string;
}

/**
 * Result of image processing
 *
 * @public
 */
export interface ImageProcessorResult {
	/** Original image dimensions */
	width: number;
	height: number;
	/** Generated image variants */
	variants: ImageVariant[];
	/** LQIP placeholder URL (if generated) */
	placeholder?: string;
}

/**
 * Single image variant
 *
 * @public
 */
export interface ImageVariant {
	/** Format (webp, avif, jpg, png) */
	format: string;
	/** Width in pixels */
	width: number;
	/** Height in pixels */
	height: number;
	/** File size in bytes */
	size: number;
	/** Output file path */
	path: string;
}

/**
 * Generate a cache key for an image
 * Module-private helper
 */
function generateCacheKey(
	inputPath: string,
	format: string,
	width: number,
	quality: number
): string {
	const hash = createHash('md5');
	hash.update(`${inputPath}:${format}:${width}:${quality}`);
	return hash.digest('hex');
}

/**
 * Check if cached image exists and is up-to-date
 * Module-private helper
 */
function isCacheValid(inputPath: string, cachedPath: string): boolean {
	if (!existsSync(cachedPath)) {
		return false;
	}

	const inputStats = existsSync(inputPath) ? require('fs').statSync(inputPath) : null;
	const cachedStats = require('fs').statSync(cachedPath);

	if (!inputStats) {
		return false;
	}

	// Check if input is newer than cached version
	return inputStats.mtime <= cachedStats.mtime;
}

/**
 * Process single image variant
 * Module-private helper
 */
async function processVariant(
	sharpInstance: sharp.Sharp,
	format: string,
	width: number,
	quality: number,
	outputPath: string,
	originalFormat: string
): Promise<ImageVariant> {
	// Resize image
	let pipeline = sharpInstance.clone().resize(width, null, {
		withoutEnlargement: true,
		fit: 'inside'
	});

	// Apply format-specific optimizations
	if (format === 'webp') {
		pipeline = pipeline.webp({ quality });
	} else if (format === 'avif') {
		pipeline = pipeline.avif({ quality });
	} else if (format === 'jpg' || format === 'jpeg') {
		pipeline = pipeline.jpeg({ quality, mozjpeg: true });
	} else if (format === 'png') {
		pipeline = pipeline.png({ quality: Math.min(quality, 9), compressionLevel: 9 });
	} else if (format === 'original') {
		// Keep original format
		const ext = originalFormat.toLowerCase();
		if (ext === 'jpg' || ext === 'jpeg') {
			pipeline = pipeline.jpeg({ quality, mozjpeg: true });
		} else if (ext === 'png') {
			pipeline = pipeline.png({ quality: Math.min(quality, 9), compressionLevel: 9 });
		}
	}

	// Ensure output directory exists
	mkdirSync(dirname(outputPath), { recursive: true });

	// Write file
	const metadata = await pipeline.toFile(outputPath);
	const stats = require('fs').statSync(outputPath);

	return {
		format,
		width: metadata.width || width,
		height: metadata.height || 0,
		size: stats.size,
		path: outputPath
	};
}

/**
 * Process an image with Sharp to generate optimized variants
 *
 * Generates:
 * - Multiple formats (WebP, AVIF, original)
 * - Multiple sizes for responsive images
 * - LQIP blur placeholder
 *
 * Uses caching to avoid reprocessing unchanged images.
 *
 * @param config - Image processing configuration
 * @returns Processing result with all variants
 *
 * @public
 *
 * @example
 * ```typescript
 * const result = await processImage({
 *   inputPath: './docs/images/screenshot.png',
 *   outputDir: './static/images/optimized',
 *   formats: ['webp', 'avif', 'original'],
 *   sizes: [640, 960, 1280],
 *   quality: { webp: 85, avif: 80 }
 * });
 * ```
 */
export async function processImage(
	config: ImageProcessorConfig
): Promise<ImageProcessorResult> {
	const { inputPath, outputDir, formats, sizes, quality, generatePlaceholder, cacheDir } = config;

	// Read input image
	if (!existsSync(inputPath)) {
		throw new Error(`Input image not found: ${inputPath}`);
	}

	const sharpInstance = sharp(inputPath);
	const metadata = await sharpInstance.metadata();

	if (!metadata.width || !metadata.height) {
		throw new Error(`Could not read image dimensions: ${inputPath}`);
	}

	const originalFormat = metadata.format || extname(inputPath).slice(1);
	const fileBaseName = basename(inputPath, extname(inputPath));
	const variants: ImageVariant[] = [];

	// Process each format + size combination
	for (const format of formats) {
		const actualFormat = format === 'original' ? originalFormat : format;

		for (const width of sizes) {
			// Skip if width is larger than original
			if (width > metadata.width) {
				continue;
			}

			// Generate output path
			const outputFileName = `${fileBaseName}-${width}w.${actualFormat}`;
			const outputPath = join(outputDir, outputFileName);

			// Check cache
			if (cacheDir && isCacheValid(inputPath, outputPath)) {
				// Use cached version
				const stats = require('fs').statSync(outputPath);
				const cachedMetadata = await sharp(outputPath).metadata();

				variants.push({
					format: actualFormat,
					width: cachedMetadata.width || width,
					height: cachedMetadata.height || 0,
					size: stats.size,
					path: outputPath
				});

				continue;
			}

			// Process image
			const formatQuality = quality[format] || quality[actualFormat] || 85;
			const variant = await processVariant(
				sharpInstance,
				actualFormat,
				width,
				formatQuality,
				outputPath,
				originalFormat
			);

			variants.push(variant);
		}
	}

	// Generate LQIP placeholder (tiny 40px blur)
	let placeholder: string | undefined;
	if (generatePlaceholder) {
		const placeholderPath = join(outputDir, `${fileBaseName}-placeholder.jpg`);

		if (!cacheDir || !isCacheValid(inputPath, placeholderPath)) {
			await sharpInstance
				.clone()
				.resize(40, null, { withoutEnlargement: true, fit: 'inside' })
				.jpeg({ quality: 50 })
				.toFile(placeholderPath);
		}

		placeholder = placeholderPath;
	}

	return {
		width: metadata.width,
		height: metadata.height,
		variants,
		placeholder
	};
}

/**
 * Batch process multiple images
 *
 * @param configs - Array of image processing configurations
 * @returns Array of processing results
 *
 * @public
 */
export async function batchProcessImages(
	configs: ImageProcessorConfig[]
): Promise<ImageProcessorResult[]> {
	const results: ImageProcessorResult[] = [];

	for (const config of configs) {
		try {
			const result = await processImage(config);
			results.push(result);
		} catch (error) {
			console.error(`Failed to process image ${config.inputPath}:`, error);
			// Continue with other images
		}
	}

	return results;
}
