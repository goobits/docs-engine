/**
 * Generic Documentation Generator
 *
 * Configuration-driven generator that parses source files,
 * categorizes content, and generates markdown documentation.
 */

import { readFile } from 'fs';
import { promisify } from 'util';
import type { GeneratorConfig, GeneratorResult, GeneratorStats, CategoryRule } from './types';
import { parseJSON, parseEnv, parseSQL, parseGrep, type ParsedItem } from './parsers/index';

const readFileAsync = promisify(readFile);

/**
 * Generic documentation generator
 */
export class GenericGenerator {
  constructor(private config: GeneratorConfig) {}

  /**
   * Generate documentation
   */
  async generate(): Promise<GeneratorResult> {
    // 1. Parse source file
    const items = await this.parse();

    // 2. Categorize items
    const categorized = this.categorize(items);

    // 3. Enrich with metadata
    const enriched = this.enrich(categorized);

    // 4. Generate markdown
    const markdown = this.generateMarkdown(enriched);

    // 5. Calculate stats
    const stats = this.calculateStats(enriched);

    return {
      markdown,
      stats,
      lineCount: markdown.split('\n').length,
    };
  }

  /**
   * Parse source file based on parser configuration
   */
  private async parse(): Promise<ParsedItem[]> {
    const content = await readFileAsync(this.config.input, 'utf-8');
    const parser = this.config.parser;

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
        return parser.parse(content, this.config);

      default:
        throw new Error(`Unknown parser type: ${(parser as { type?: string }).type}`);
    }
  }

  /**
   * Categorize items based on rules
   */
  private categorize(items: ParsedItem[]): Map<string, ParsedItem[]> {
    const categorized = new Map<string, ParsedItem[]>();

    // Initialize categories
    for (const rule of this.config.categories) {
      categorized.set(rule.name, []);
    }
    categorized.set('__uncategorized__', []);

    // Apply rules
    for (const item of items) {
      let assigned = false;

      for (const rule of this.config.categories) {
        if (this.matchesRule(item, rule)) {
          categorized.get(rule.name)!.push({ ...item, category: rule.name });
          assigned = true;
          break; // First match wins
        }
      }

      if (!assigned) {
        categorized.get('__uncategorized__')!.push({ ...item, category: 'Other' });
      }
    }

    // Remove empty categories
    for (const [name, items] of categorized) {
      if (items.length === 0) {
        categorized.delete(name);
      }
    }

    return categorized;
  }

  /**
   * Check if item matches category rule
   */
  private matchesRule(item: ParsedItem, rule: CategoryRule): boolean {
    if (typeof rule.match === 'function') {
      return rule.match(item);
    }

    // Regex pattern
    const pattern = new RegExp(rule.match);
    const testValue = item.name || item.value || item.key || String(item);
    return pattern.test(testValue);
  }

  /**
   * Enrich items with metadata
   */
  private enrich(categorized: Map<string, ParsedItem[]>): Map<string, ParsedItem[]> {
    if (!this.config.enrichments && !this.config.descriptions) {
      return categorized;
    }

    const enriched = new Map<string, ParsedItem[]>();

    for (const [category, items] of categorized) {
      enriched.set(
        category,
        items.map((item) => this.enrichItem(item))
      );
    }

    return enriched;
  }

  /**
   * Enrich single item
   */
  private enrichItem(item: ParsedItem): ParsedItem {
    const enriched = { ...item };

    // Apply enrichment rules
    if (this.config.enrichments) {
      for (const rule of this.config.enrichments) {
        if (typeof rule.value === 'function') {
          enriched[rule.field] = rule.value(item);
        } else {
          const key = item.name || item.key;
          enriched[rule.field] = rule.value[key] || enriched[rule.field];
        }
      }
    }

    // Apply descriptions
    if (this.config.descriptions) {
      const key = item.name || item.key || item.value;
      if (key && this.config.descriptions[key]) {
        enriched.description = this.config.descriptions[key];
      }
    }

    return enriched;
  }

  /**
   * Generate markdown from categorized items
   */
  private generateMarkdown(categorized: Map<string, ParsedItem[]>): string {
    const sections: string[] = [];
    const template = this.config.template;

    // Title
    sections.push(`# ${template.title}\n`);

    // Source header
    if (template.source) {
      sections.push(`> **Source**: ${template.source}`);
      sections.push(`> **Generated**: ${new Date().toISOString()}\n`);
    }

    // Overview
    if (template.overview) {
      sections.push('## Overview\n');
      if (typeof template.overview === 'function') {
        const stats = this.calculateStats(categorized);
        sections.push(template.overview(stats) + '\n');
      } else {
        sections.push(template.overview + '\n');
      }
    }

    // Statistics
    if (template.showStats) {
      const stats = this.calculateStats(categorized);
      sections.push('### Statistics\n');
      sections.push(`- **Total items**: ${stats.totalItems}`);
      sections.push(`- **Categories**: ${stats.categoryCount}\n`);
    }

    // Table of contents
    if (template.showTOC) {
      sections.push('## Categories\n');
      for (const [category, items] of categorized) {
        if (category === '__uncategorized__') continue;
        const anchor = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        sections.push(`- [${category}](#${anchor}) (${items.length} items)`);
      }
      sections.push('');
    }

    // Category sections
    for (const [category, items] of categorized) {
      if (category === '__uncategorized__') continue;

      sections.push(`## ${category}\n`);

      // Generate table
      const headers = template.columns.map((col) => col.header);
      const rows = items.map((item) =>
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

      sections.push(this.generateTable(headers, rows));
      sections.push('');
    }

    // Footer
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

  /**
   * Generate markdown table
   */
  private generateTable(headers: string[], rows: string[][]): string {
    const lines: string[] = [];

    // Header
    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');

    // Rows
    for (const row of rows) {
      lines.push('| ' + row.join(' | ') + ' |');
    }

    return lines.join('\n');
  }

  /**
   * Calculate statistics
   */
  private calculateStats(categorized: Map<string, ParsedItem[]>): GeneratorStats {
    const stats: GeneratorStats = {
      totalItems: 0,
      categoryCount: 0,
      itemsByCategory: {},
      uncategorized: 0,
    };

    for (const [category, items] of categorized) {
      if (category === '__uncategorized__') {
        stats.uncategorized = items.length;
      } else {
        stats.categoryCount++;
        stats.itemsByCategory[category] = items.length;
      }
      stats.totalItems += items.length;
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
