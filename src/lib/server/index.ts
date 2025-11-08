export { createScreenshotEndpoint } from './screenshot-service';
export type * from './types';

// Structured logging
export * from './logger';

// Rate limiting
export * from './rate-limiter';

// Circuit breaker
export * from './circuit-breaker';

// SEO utilities (Proposal 05)
export * from './sitemap';
export type { SitemapUrl, SitemapConfig } from './sitemap';

// Image optimization (Proposal 10)
export * from './image-processor';
export type { ImageProcessorConfig, ImageProcessorResult, ImageVariant } from './image-processor';

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
  ApiParserConfig,
} from '../generators/api-parser';
export type { MarkdownGeneratorConfig } from '../generators/api-docs';

// Generic documentation generators - Server-side only (requires Node.js fs, child_process)
export * from '../generators/generic-generator';
export type {
  GeneratorConfig,
  GeneratorResult,
  GeneratorStats,
  CategoryRule,
  EnrichmentRule,
  MarkdownTemplate,
  ParserConfig,
} from '../generators/types';

// Navigation scanner utilities - Server-side only (requires Node.js fs/promises)
export * from '../utils/navigation-scanner';
export type { ScanOptions, EnhancedNavigationOptions } from '../utils/navigation-scanner';

// Markdown generation utilities - Server-side only
export * from '../utils/markdown';

// File I/O utilities - Server-side only (requires Node.js fs)
export * from '../utils/file-io';

// Symbol generation utilities - Server-side only (requires Node.js fs, glob, typescript)
export * from '../utils/symbol-generation';
export type {
  SymbolGeneratorConfig,
  SymbolDefinition as SymbolGenDefinition,
  SymbolMap as SymbolGenMap,
} from '../utils/symbol-generation';
