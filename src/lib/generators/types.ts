/**
 * Generic Documentation Generator Types
 *
 * Framework for creating configuration-driven documentation generators
 * that parse source files, categorize content, and generate markdown.
 */

/**
 * Category matching rule
 */
export interface CategoryRule {
  /** Category name */
  name: string;
  /** Display order priority (lower = first) */
  order?: number;
  /** Match condition */
  match:
    | string // Regex pattern as string
    | ((item: any) => boolean); // Custom function
  /** Optional category description */
  description?: string;
}

/**
 * Enrichment rule for adding metadata
 */
export interface EnrichmentRule {
  /** Field name to add */
  field: string;
  /** Value mapping or function */
  value:
    | Record<string, any> // Static mapping
    | ((item: any) => any); // Dynamic function
}

/**
 * Markdown template configuration
 */
export interface MarkdownTemplate {
  /** Document title */
  title: string;
  /** Source file description */
  source?: string;
  /** Overview section content */
  overview?: string | ((stats: any) => string);
  /** Table columns configuration */
  columns: Array<{
    header: string;
    field: string | ((item: any) => string);
    format?: (value: any) => string;
  }>;
  /** Additional sections to append */
  footer?: string | string[];
  /** Show table of contents */
  showTOC?: boolean;
  /** Show statistics */
  showStats?: boolean;
}

/**
 * Parser configuration
 */
export type ParserConfig =
  | {
      type: 'json';
      /** JSONPath to extract items (e.g., "scripts" for package.json) */
      path?: string;
    }
  | {
      type: 'env';
      /** Comment prefix for categories */
      categoryPrefix?: string;
    }
  | {
      type: 'sql';
      /** Table pattern to match */
      tablePattern?: RegExp;
    }
  | {
      type: 'grep';
      /** Grep command to execute */
      command: string;
      /** Pattern to extract from matches */
      extractPattern?: RegExp;
    }
  | {
      type: 'custom';
      /** Custom parser function */
      parse: (content: string, config: any) => any[];
    };

/**
 * Complete generator configuration
 */
export interface GeneratorConfig {
  /** Input file path */
  input: string;
  /** Output file path */
  output: string;
  /** Parser configuration */
  parser: ParserConfig;
  /** Categorization rules (applied in order) */
  categories: CategoryRule[];
  /** Enrichment rules (add metadata to items) */
  enrichments?: EnrichmentRule[];
  /** Description mappings */
  descriptions?: Record<string, string>;
  /** Markdown template */
  template: MarkdownTemplate;
}

/**
 * Generator statistics
 */
export interface GeneratorStats {
  totalItems: number;
  categoryCount: number;
  itemsByCategory: Record<string, number>;
  uncategorized: number;
}

/**
 * Generator result
 */
export interface GeneratorResult {
  markdown: string;
  stats: GeneratorStats;
  lineCount: number;
}
