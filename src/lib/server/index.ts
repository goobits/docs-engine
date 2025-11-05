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

// Git utilities (Proposal 02) - Server-side only
export * from '../utils/git';
export type { GitConfig, Contributor, GitProvider } from '../utils/git';

// Version utilities - Server-side only (requires Node.js fs)
export * from '../utils/version';

// API documentation generator (Proposal 09) - Server-side only (requires ts-morph)
export * from '../generators/api-parser';
export * from '../generators/api-docs';
export type {
	ApiItem,
	ApiFunction,
	ApiClass,
	ApiInterface,
	ApiTypeAlias,
	ApiEnum,
	ApiParameter,
	ApiProperty,
	ApiMethod,
	ApiMetadata,
	ApiExample,
	ParsedApiFile,
	ApiParserConfig
} from '../generators/api-parser';
export type { MarkdownGeneratorConfig } from '../generators/api-docs';
