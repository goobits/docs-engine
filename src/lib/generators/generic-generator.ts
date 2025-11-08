/**
 * Generic Documentation Generator
 *
 * Configuration-driven generator that parses source files,
 * categorizes content, and generates markdown documentation.
 */

import { readFile } from 'fs';
import { promisify } from 'util';
import { execSync } from 'child_process';
import type { GeneratorConfig, GeneratorResult, GeneratorStats, CategoryRule } from './types';

const readFileAsync = promisify(readFile);

/**
 * Generic parsed item - represents any parsed data structure
 * The actual shape depends on the parser type (JSON, ENV, SQL, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParsedItem = any;

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
        return this.parseJSON(content, parser.path);

      case 'env':
        return this.parseEnv(content, parser.categoryPrefix);

      case 'sql':
        return this.parseSQL(content, parser.tablePattern);

      case 'grep':
        return this.parseGrep(parser.command, parser.extractPattern);

      case 'custom':
        return parser.parse(content, this.config);

      default:
        throw new Error(`Unknown parser type: ${(parser as { type?: string }).type}`);
    }
  }

  /**
   * Parse JSON file
   */
  private parseJSON(content: string, path?: string): ParsedItem[] {
    const data = JSON.parse(content);

    if (!path) {
      // If no path, assume data is array or convert object to entries
      return Array.isArray(data)
        ? data
        : Object.entries(data).map(([key, value]) => ({ key, value }));
    }

    // Extract from path (e.g., "scripts" -> data.scripts)
    const extracted = path.split('.').reduce((obj, key) => obj?.[key], data);

    if (!extracted) {
      throw new Error(`Path "${path}" not found in JSON`);
    }

    // Convert to array of items
    if (Array.isArray(extracted)) {
      return extracted;
    }

    // Convert object to array with key-value pairs
    return Object.entries(extracted).map(([key, value]) => ({
      name: key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
  }

  /**
   * Parse .env file
   */
  private parseEnv(content: string, categoryPrefix = '#'): ParsedItem[] {
    const lines = content.split('\n');
    const variables: ParsedItem[] = [];
    let currentCategory = 'General';
    let currentComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        currentComments = [];
        continue;
      }

      // Category detection
      if (trimmed.startsWith(categoryPrefix)) {
        const categoryMatch = trimmed.match(/^#\s*---\s*(.+?)\s*---/);
        if (categoryMatch) {
          currentCategory = categoryMatch[1].trim();
          currentComments = [];
          continue;
        }

        // Multi-line category format
        if (trimmed === '# ---') {
          const nextLine = lines[i + 1]?.trim();
          if (nextLine?.startsWith('#')) {
            const categoryName = nextLine.replace(/^#\s*/, '').trim();
            if (categoryName && !categoryName.match(/^[-=]+$/)) {
              currentCategory = categoryName;
              i += 2; // Skip category lines
              currentComments = [];
              continue;
            }
          }
        }
      }

      // Variable line
      const varMatch = line.match(/^\s*(#\s*)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (varMatch) {
        const name = varMatch[2];
        let value = varMatch[3].trim();

        // Remove inline comments
        value = value.replace(/\s*#.*$/, '');

        // Remove quotes
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        variables.push({
          category: currentCategory,
          name,
          value: value || '(not set)',
          description: currentComments.join(' ').trim() || 'No description',
          isCommented: !!varMatch[1],
        });

        currentComments = [];
        continue;
      }

      // Comment line
      if (trimmed.startsWith(categoryPrefix)) {
        const comment = trimmed.replace(/^#\s*/, '').trim();
        if (comment && !comment.match(/^[-=]+$/)) {
          currentComments.push(comment);
        }
      }
    }

    return variables;
  }

  /**
   * Parse SQL schema
   */
  private parseSQL(content: string, _tablePattern?: RegExp): ParsedItem[] {
    const tables: ParsedItem[] = [];
    const lines = content.split('\n');
    let currentTable: ParsedItem | null = null;
    let inTableDef = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Table start
      const tableMatch = trimmed.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(/);
      if (tableMatch) {
        currentTable = {
          name: tableMatch[1],
          columns: [],
          constraints: [],
        };
        inTableDef = true;
        continue;
      }

      // Table end
      if (inTableDef && trimmed === ');') {
        inTableDef = false;
        if (currentTable) {
          tables.push(currentTable);
          currentTable = null;
        }
        continue;
      }

      // Column definition
      if (inTableDef && currentTable && !trimmed.startsWith('--')) {
        if (trimmed.startsWith('CONSTRAINT') || trimmed.startsWith('PRIMARY KEY')) {
          currentTable.constraints.push(trimmed);
        } else if (trimmed) {
          const columnMatch = trimmed.match(/^(\w+)\s+([A-Z]+[^,]*)/);
          if (columnMatch) {
            currentTable.columns.push({
              name: columnMatch[1],
              type: columnMatch[2].split(/\s+/)[0],
            });
          }
        }
      }
    }

    return tables;
  }

  /**
   * Parse grep output
   */
  private parseGrep(command: string, extractPattern?: RegExp): ParsedItem[] {
    try {
      const output = execSync(command, { encoding: 'utf-8' });
      const lines = output.split('\n').filter(Boolean);

      if (!extractPattern) {
        return lines.map((line) => ({ value: line.trim() }));
      }

      const items: ParsedItem[] = [];
      for (const line of lines) {
        const match = line.match(extractPattern);
        if (match) {
          items.push({ value: match[1] || match[0] });
        }
      }

      return items;
    } catch {
      console.warn(`Grep command failed: ${command}`);
      return [];
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
