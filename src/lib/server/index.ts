export { createScreenshotEndpoint } from './screenshot-service';
export type * from './types';

// SEO utilities (Proposal 05)
export * from './sitemap';
export type { SitemapUrl, SitemapConfig } from './sitemap';

// Image optimization (Proposal 10)
export * from './image-processor';
export type {
	ImageProcessorConfig,
	ImageProcessorResult,
	ImageVariant
} from './image-processor';
