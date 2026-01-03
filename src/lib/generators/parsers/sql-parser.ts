/**
 * SQL Parser
 *
 * Parses SQL schema files and extracts table definitions.
 */

import type { ParsedItem } from './types';

/**
 * Parse SQL schema content
 * @param content - Raw SQL content
 * @param _tablePattern - Optional regex pattern for table names (reserved for future use)
 * @returns Array of parsed table definitions
 */
export function parseSQL(content: string, _tablePattern?: RegExp): ParsedItem[] {
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
