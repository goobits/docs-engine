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

// NOTE: Navigation scanner moved to server/index.ts (requires Node.js fs/promises)
// Import from '@goobits/docs-engine/server' instead

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
export type {
  SearchDocument,
  SearchResult as SearchIndexResult,
  SearchIndexConfig,
} from './search-index';

// Symbol reference utilities
export * from './symbol-resolver';
export type { SymbolDefinition, SymbolMap } from './symbol-resolver';
export * from './symbol-renderer';
export type { RenderOptions } from './symbol-renderer';

// NOTE: Markdown generation utilities moved to server/index.ts (requires Node.js)
// NOTE: File I/O utilities moved to server/index.ts (requires Node.js fs)
// NOTE: Symbol generation utilities moved to server/index.ts (requires Node.js fs, glob, typescript)
// NOTE: Version utilities moved to server/index.ts (requires Node.js fs)
// Import from '@goobits/docs-engine/server' instead
