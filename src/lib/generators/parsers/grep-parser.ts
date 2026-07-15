/**
 * Grep Parser
 *
 * Executes a grep command and parses the output.
 */

import { execFileSync } from 'child_process';
import type { ParsedItem } from './index.ts';

const ALLOWED_GREP_COMMANDS = new Set(['grep', 'rg']);

/**
 * Execute grep command and parse output
 * @param command - Grep-compatible executable to run
 * @param args - Arguments passed directly to the executable
 * @param extractPattern - Optional regex to extract values from each line
 * @returns Array of parsed items
 */
export function parseGrep(
  command: string,
  args: readonly string[],
  extractPattern?: RegExp
): ParsedItem[] {
  if (!ALLOWED_GREP_COMMANDS.has(command)) {
    console.warn(`Grep command is not allowed: ${command}`);
    return [];
  }
  try {
    const output = execFileSync(command, args, { encoding: 'utf-8' });
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
    console.warn(`Grep command failed: ${command} ${JSON.stringify(args)}`);
    return [];
  }
}
