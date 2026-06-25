export { createScreenshotEndpoint } from './screenshot-service.ts';
export type { ScreenshotRequest, ScreenshotResponse } from './screenshot-service.ts';
export { renderDocsMarkdown } from './markdownRenderer.ts';
export type { RenderDocsMarkdownOptions } from './markdownRenderer.ts';

/**
 * Represents a documentation page loaded from a markdown file
 */
export interface DocPage {
  markdown: string;
  title: string;
  slug: string;
}

/**
 * Document loader interface for loading markdown files
 */
export interface DocsLoader {
  load(slug: string): Promise<DocPage>;
}

/**
 * Markdown renderer interface for converting markdown to HTML
 */
export interface MarkdownRenderer {
  render(markdown: string): Promise<string>;
}

// Structured logging
export * from './logger.ts';

// Rate limiting
export * from './rate-limiter.ts';

// Circuit breaker
export * from './circuit-breaker.ts';

// SEO utilities (Proposal 05)
export * from './sitemap.ts';
export type { SitemapUrl, SitemapConfig } from './sitemap.ts';

// Image optimization (Proposal 10)
export * from './image-processor.ts';
export type {
  ImageProcessorConfig,
  ImageProcessorResult,
  ImageVariant,
} from './image-processor.ts';

// Git utilities (Proposal 02) - Server-side only
export * from '../utils/git.ts';
export type { GitConfig, Contributor, GitProvider } from '../utils/git.ts';

// Version utilities - Server-side only (requires Node.js fs)
export * from '../utils/version.ts';

// API documentation generator (Proposal 09) - Server-side only (requires ts-morph)
export * from '../generators/api-parser.ts';
export * from '../generators/api-docs.ts';
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
} from '../generators/api-parser.ts';
export type { MarkdownGeneratorConfig } from '../generators/api-docs.ts';

// Generic documentation generators - Server-side only (requires Node.js fs, child_process)
export * from '../generators/generic-generator.ts';
export type {
  GeneratorConfig,
  GeneratorResult,
  GeneratorStats,
  CategoryRule,
  EnrichmentRule,
  MarkdownTemplate,
  ParserConfig,
} from '../generators/generic-generator.ts';

// Navigation scanner utilities - Server-side only (requires Node.js fs/promises)
export * from '../utils/navigation-scanner.ts';
export type { ScanOptions, EnhancedNavigationOptions } from '../utils/navigation-scanner.ts';

// Markdown generation utilities - Server-side only
export * from '../utils/markdown.ts';

// File I/O utilities - Server-side only (requires Node.js fs)
export * from '../utils/file-io.ts';

// Symbol generation utilities - Server-side only (requires Node.js fs, glob, typescript)
export * from '../utils/symbol-generation.ts';
export type {
  SymbolGeneratorConfig,
  SymbolDefinition as SymbolGenDefinition,
  SymbolMap as SymbolGenMap,
} from '../utils/symbol-generation.ts';

// Symbol reference utilities - Server-side only (loads generated files from disk)
export * from '../utils/symbol-resolver.ts';
export type { SymbolDefinition, SymbolMap } from '../utils/symbol-resolver.ts';
export * from '../utils/symbol-renderer.ts';
export type { RenderOptions } from '../utils/symbol-renderer.ts';
