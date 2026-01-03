/**
 * Parser Types
 *
 * Shared types for all parsers in the generic generator system.
 */

/**
 * Generic parsed item - represents any parsed data structure
 * The actual shape depends on the parser type (JSON, ENV, SQL, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParsedItem = any;

/**
 * Base parser interface that all parsers implement
 */
export interface Parser {
  parse(content: string): ParsedItem[];
}
