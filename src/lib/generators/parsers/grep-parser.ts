/**
 * Grep Parser
 *
 * Executes a grep command and parses the output.
 */

import { execSync } from 'child_process';
import type { ParsedItem } from './index';

/**
 * Execute grep command and parse output
 * @param command - Shell command to execute
 * @param extractPattern - Optional regex to extract values from each line
 * @returns Array of parsed items
 */
export function parseGrep(command: string, extractPattern?: RegExp): ParsedItem[] {
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
