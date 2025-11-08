/**
 * Docs Engine Utilities
 *
 * Browser-safe utilities for docs-engine components
 * Re-exported from src/lib/utils for convenience
 */

// Navigation utilities
export { getAdjacentLinks } from './navigation';
export type { DocsLink } from './navigation';

// Git utilities
export type { Contributor } from './git';

// Date utilities
export { formatRelativeDate } from './date';

// Search utilities
export { loadSearchIndex, performSearch, highlightMatches } from './search-index';
export type { SearchResult } from './search-index';

// Base64 utilities
export { decodeJsonBase64, encodeJsonBase64 } from './base64';

// OpenAPI formatter utilities
export {
  parseOpenAPISpec,
  filterEndpointsByPath,
  formatSchema,
  generateCurlExample,
  generateTypeScriptExample,
} from './openapi-formatter';
export type {
  OpenAPIEndpoint,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
} from './openapi-formatter';

// Tree types (for FileTree component)
export interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  path?: string;
  children?: TreeNode[];
}
