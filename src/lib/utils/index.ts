// Navigation utilities
export * from './navigation';
export type { DocsLink, DocsSection } from './navigation';

// Navigation builder utilities
export * from './navigation-builder';
export type {
	DocFrontmatter,
	DocFile,
	IconMap,
	NavigationBuilderOptions,
} from './navigation-builder';

// Search utilities
export * from './search';
export type { SearchResult, SearchOptions } from './search';

// Tree parser utilities
export * from './tree-parser';
export type { TreeNode, FileTypeConfig } from './tree-parser';

// Frontmatter utilities
export * from './frontmatter';
export type { Frontmatter, ParsedContent } from './frontmatter';

// Base64 utilities
export * from './base64';

// Date utilities (browser-safe)
export * from './date';

// Highlighter utilities
export * from './highlighter';

// OpenAPI formatter utilities
export * from './openapi-formatter';
export type { OpenAPIEndpoint } from './openapi-formatter';

// HTML utilities
export * from './html';

// NOTE: Git utilities moved to server/index.ts (requires Node.js child_process)
// Import from '@goobits/docs-engine/server' instead

// Search index utilities (Proposal 03)
export * from './search-index';
export type { SearchDocument, SearchResult as SearchIndexResult, SearchIndexConfig } from './search-index';

// Symbol reference utilities
export * from './symbol-resolver';
export type { SymbolDefinition, SymbolMap } from './symbol-resolver';
export * from './symbol-renderer';
export type { RenderOptions } from './symbol-renderer';

// NOTE: Version utilities moved to server/index.ts (requires Node.js fs)
// Import from '@goobits/docs-engine/server' instead

// Internationalization (i18n) utilities (Proposal 14)
export * from './i18n';
export * from './i18n-seo';
export type { LocalizedContent } from './i18n-loader';
export type { HreflangLink } from './i18n-seo';

// NOTE: i18n-loader and i18n-docs-loader moved to server/index.ts (require Node.js fs)
// Import from '@goobits/docs-engine/server' instead
