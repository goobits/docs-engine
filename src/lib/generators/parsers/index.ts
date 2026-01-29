/**
 * Parser Exports
 *
 * Central export point for all parsers.
 */

export { parseJSON } from './json-parser';
export { parseEnv } from './env-parser';
export { parseSQL } from './sql-parser';
export { parseGrep } from './grep-parser';

/**
 * Generic parsed item - represents any parsed data structure.
 * Uses Record<string, unknown> for type safety while allowing
 * flexible property access (the actual shape depends on the parser).
 */
export type ParsedItem = Record<string, unknown>;

/**
 * Base parser interface that all parsers implement
 */
export interface Parser {
  parse(content: string): ParsedItem[];
}
