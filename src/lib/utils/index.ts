// Navigation utilities
export * from './navigation.ts';
export type { DocsLink, DocsSection } from './navigation.ts';

// Navigation builder utilities
export * from './navigation-builder.ts';
export type {
  DocFrontmatter,
  DocFile,
  IconMap,
  NavigationBuilderOptions,
} from './navigation-builder.ts';

// NOTE: Navigation scanner moved to server/index.ts (requires Node.js fs/promises)
// Import from '@goobits/docs-engine/server' instead

// Search utilities
export * from './search.ts';
export type { SearchResult, SearchOptions } from './search.ts';

// Tree parser utilities
export * from './tree-parser.ts';
export type { TreeNode, FileTypeConfig } from './tree-parser.ts';

// Frontmatter utilities
export * from './frontmatter.ts';
export type { Frontmatter, ParsedContent } from './frontmatter.ts';

// Base64 utilities
export * from './base64.ts';

// Date utilities (browser-safe)
export * from './date.ts';

// Highlighter utilities
export * from './highlighter.ts';

// OpenAPI formatter utilities
export * from './openapi-formatter.ts';
export type { OpenAPIEndpoint } from './openapi-formatter.ts';

// HTML utilities
export * from './html.ts';

// Sanitize utilities
export * from './sanitize.ts';

// Logger utilities (browser-safe)
export { createBrowserLogger } from './browser-logger.ts';

// Hydrator lifecycle composable (browser-only, requires Svelte)
export { useHydrator } from './use-hydrator.ts';
export type { HydratorOptions } from './use-hydrator.ts';

// NOTE: Git utilities moved to server/index.ts (requires Node.js child_process)
// Import from '@goobits/docs-engine/server' instead

// Search index utilities (Proposal 03)
export * from './search-index.ts';
export type {
  SearchDocument,
  SearchResult as SearchIndexResult,
  SearchIndexConfig,
} from './search-index.ts';

// NOTE: Symbol reference utilities moved to server/index.ts
// because symbol resolution loads generated files from disk.
// Import from '@goobits/docs-engine/server' instead.

// NOTE: Markdown generation utilities moved to server/index.ts (requires Node.js)
// NOTE: File I/O utilities moved to server/index.ts (requires Node.js fs)
// NOTE: Symbol generation utilities moved to server/index.ts (requires Node.js fs, glob, typescript)
// NOTE: Version utilities moved to server/index.ts (requires Node.js fs)
// Import from '@goobits/docs-engine/server' instead
