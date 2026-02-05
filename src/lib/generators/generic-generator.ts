/**
 * Generic Documentation Generator
 *
 * Configuration-driven generator that parses source files,
 * categorizes content, and generates markdown documentation.
 */

import { readFile } from 'fs';
import { promisify } from 'util';
import { parseJSON, parseEnv, parseSQL, parseGrep, type ParsedItem } from './parsers/index';

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
    | ((item: unknown) => boolean); // Custom function
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
    | Record<string, unknown> // Static mapping
    | ((item: unknown) => unknown); // Dynamic function
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
  overview?: string | ((stats: unknown) => string);
  /** Table columns configuration */
  columns: Array<{
    header: string;
    field: string | ((item: unknown) => string);
    format?: (value: unknown) => string;
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
      parse: (content: string, config: unknown) => ParsedItem[];
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

const readFileAsync = promisify(readFile);

/**
 * Generic documentation generator
 */
export class GenericGenerator {
  readonly #config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.#config = config;
  }

  /**
   * Generate documentation
   */
  async generate(): Promise<GeneratorResult> {
    const items = await this.#parse();
    const categorized = this.#categorize(items);
    const enriched = this.#enrich(categorized);
    const markdown = this.#generateMarkdown(enriched);
    const stats = this.#calculateStats(enriched);

    return {
      markdown,
      stats,
      lineCount: markdown.split('\n').length,
    };
  }

  async #parse(): Promise<ParsedItem[]> {
    const content = await readFileAsync(this.#config.input, 'utf-8');
    const parser = this.#config.parser;

    switch (parser.type) {
      case 'json':
        return parseJSON(content, parser.path);
      case 'env':
        return parseEnv(content, parser.categoryPrefix);
      case 'sql':
        return parseSQL(content, parser.tablePattern);
      case 'grep':
        return parseGrep(parser.command, parser.extractPattern);
      case 'custom':
        return parser.parse(content, this.#config);
      default:
        throw new Error(`Unknown parser type: ${(parser as { type?: string }).type}`);
    }
  }

  #categorize(items: ParsedItem[]): Map<string, ParsedItem[]> {
    const categorized = new Map<string, ParsedItem[]>();

    for (const rule of this.#config.categories) {
      categorized.set(rule.name, []);
    }
    categorized.set('__uncategorized__', []);

    for (const item of items) {
      let assigned = false;

      for (const rule of this.#config.categories) {
        if (this.#matchesRule(item, rule)) {
          categorized.get(rule.name)?.push({ ...item, category: rule.name });
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        categorized.get('__uncategorized__')?.push({ ...item, category: 'Other' });
      }
    }

    for (const [name, categoryItems] of categorized) {
      if (categoryItems.length === 0) {
        categorized.delete(name);
      }
    }

    return categorized;
  }

  #matchesRule(item: ParsedItem, rule: CategoryRule): boolean {
    if (typeof rule.match === 'function') {
      return rule.match(item);
    }
    const pattern = new RegExp(rule.match);
    const testValue = String(item.name ?? item.value ?? item.key ?? item);
    return pattern.test(testValue);
  }

  #enrich(categorized: Map<string, ParsedItem[]>): Map<string, ParsedItem[]> {
    if (!this.#config.enrichments && !this.#config.descriptions) {
      return categorized;
    }

    const enriched = new Map<string, ParsedItem[]>();
    for (const [category, categoryItems] of categorized) {
      enriched.set(
        category,
        categoryItems.map((item) => this.#enrichItem(item))
      );
    }
    return enriched;
  }

  #enrichItem(item: ParsedItem): ParsedItem {
    const enriched = { ...item };

    if (this.#config.enrichments) {
      for (const rule of this.#config.enrichments) {
        if (typeof rule.value === 'function') {
          enriched[rule.field] = rule.value(item);
        } else {
          const key = String(item.name ?? item.key ?? '');
          enriched[rule.field] = rule.value[key] ?? enriched[rule.field];
        }
      }
    }

    if (this.#config.descriptions) {
      const key = String(item.name ?? item.key ?? item.value ?? '');
      if (key && this.#config.descriptions[key]) {
        enriched.description = this.#config.descriptions[key];
      }
    }

    return enriched;
  }

  #generateMarkdown(categorized: Map<string, ParsedItem[]>): string {
    const sections: string[] = [];
    const template = this.#config.template;

    sections.push(`# ${template.title}\n`);

    if (template.source) {
      sections.push(`> **Source**: ${template.source}`);
      sections.push(`> **Generated**: ${new Date().toISOString()}\n`);
    }

    if (template.overview) {
      sections.push('## Overview\n');
      if (typeof template.overview === 'function') {
        const stats = this.#calculateStats(categorized);
        sections.push(template.overview(stats) + '\n');
      } else {
        sections.push(template.overview + '\n');
      }
    }

    if (template.showStats) {
      const stats = this.#calculateStats(categorized);
      sections.push('### Statistics\n');
      sections.push(`- **Total items**: ${stats.totalItems}`);
      sections.push(`- **Categories**: ${stats.categoryCount}\n`);
    }

    if (template.showTOC) {
      sections.push('## Categories\n');
      for (const [category, categoryItems] of categorized) {
        if (category === '__uncategorized__') continue;
        const anchor = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        sections.push(`- [${category}](#${anchor}) (${categoryItems.length} items)`);
      }
      sections.push('');
    }

    for (const [category, categoryItems] of categorized) {
      if (category === '__uncategorized__') continue;

      sections.push(`## ${category}\n`);

      const headers = template.columns.map((col) => col.header);
      const rows = categoryItems.map((item) =>
        template.columns.map((col) => {
          let value: unknown;
          if (typeof col.field === 'function') {
            value = col.field(item);
          } else {
            value = item[col.field];
          }
          if (col.format) {
            value = col.format(value);
          }
          return String(value);
        })
      );

      sections.push(this.#generateTable(headers, rows));
      sections.push('');
    }

    if (template.footer) {
      sections.push('---\n');
      if (Array.isArray(template.footer)) {
        sections.push(...template.footer);
      } else {
        sections.push(template.footer);
      }
    }

    return sections.join('\n');
  }

  #generateTable(headers: string[], rows: string[][]): string {
    const lines: string[] = [];
    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');
    for (const row of rows) {
      lines.push('| ' + row.join(' | ') + ' |');
    }
    return lines.join('\n');
  }

  #calculateStats(categorized: Map<string, ParsedItem[]>): GeneratorStats {
    const stats: GeneratorStats = {
      totalItems: 0,
      categoryCount: 0,
      itemsByCategory: {},
      uncategorized: 0,
    };

    for (const [category, categoryItems] of categorized) {
      if (category === '__uncategorized__') {
        stats.uncategorized = categoryItems.length;
      } else {
        stats.categoryCount++;
        stats.itemsByCategory[category] = categoryItems.length;
      }
      stats.totalItems += categoryItems.length;
    }

    return stats;
  }
}

/**
 * Create and run a generator
 */
export async function generateDocs(config: GeneratorConfig): Promise<GeneratorResult> {
  const generator = new GenericGenerator(config);
  return generator.generate();
}
