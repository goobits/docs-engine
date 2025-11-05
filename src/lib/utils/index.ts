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

// Highlighter utilities
export * from './highlighter';

// OpenAPI formatter utilities
export * from './openapi-formatter';
export type { OpenAPIEndpoint } from './openapi-formatter';

// HTML utilities
export * from './html';

// Git utilities (Proposal 02)
export * from './git';
export type { GitConfig, Contributor, GitProvider } from './git';

// Search index utilities (Proposal 03)
export * from './search-index';
export type { SearchDocument, SearchResult as SearchIndexResult, SearchIndexConfig } from './search-index';

// Symbol reference utilities
export * from './symbol-resolver';
export type { SymbolDefinition, SymbolMap } from './symbol-resolver';
export * from './symbol-renderer';
export type { RenderOptions } from './symbol-renderer';

// Version utilities
export * from './version';
