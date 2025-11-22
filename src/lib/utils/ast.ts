/**
 * Shared AST utilities for remark/rehype plugins
 * @module
 */

/**
 * Recursively remove undefined/null nodes from an AST tree
 *
 * Some transformations can leave invalid nodes in the tree which cause
 * downstream processing errors. This utility cleans the tree by filtering
 * out any undefined or null children.
 *
 * @param node - The AST node to sanitize (usually the root)
 *
 * @example
 * ```typescript
 * import { sanitizeTree } from '../utils/ast.js';
 *
 * export function myPlugin() {
 *   return (tree: Root) => {
 *     sanitizeTree(tree);
 *     // ... rest of plugin logic
 *   };
 * }
 * ```
 *
 * @public
 */
export function sanitizeTree(node: unknown): void {
  if (!node || typeof node !== 'object') return;

  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj.children)) {
    // Filter out undefined/null children
    const children = obj.children.filter((child: unknown) => child != null);
    obj.children = children;
    // Recursively sanitize remaining children
    children.forEach((child: unknown) => sanitizeTree(child));
  }
}
