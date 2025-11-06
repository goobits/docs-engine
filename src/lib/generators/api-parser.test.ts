/**
 * Tests for API parser
 */

import { describe, it, expect } from 'vitest';
import { parseApi } from './api-parser';
import type { ApiFunction, ApiClass, ApiInterface, ApiTypeAlias, ApiEnum } from './api-parser';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('API Parser', () => {
  // Helper to create a temporary test file
  function createTempFile(content: string): { file: string; cleanup: () => void } {
    const dir = mkdtempSync(join(tmpdir(), 'api-parser-test-'));
    const file = join(dir, 'test.ts');
    writeFileSync(file, content, 'utf-8');

    return {
      file,
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
  }

  it('should parse a simple function', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Parse YAML frontmatter from markdown files
 * @param markdown - Markdown content with frontmatter
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(markdown: string): string {
	return markdown;
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });

      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);

      const item = result[0].items[0] as ApiFunction;
      expect(item.kind).toBe('function');
      expect(item.name).toBe('parseFrontmatter');
      expect(item.description).toBe('Parse YAML frontmatter from markdown files');
      expect(item.parameters).toHaveLength(1);
      expect(item.parameters[0].name).toBe('markdown');
      expect(item.parameters[0].type).toBe('string');
      expect(item.parameters[0].description).toBe('Markdown content with frontmatter');
      expect(item.returnType).toBe('string');
      expect(item.returnDescription).toBe('Parsed frontmatter and content');
    } finally {
      cleanup();
    }
  });

  it('should parse function with optional parameters', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Create a logger
 * @param name - Logger name
 * @param options - Optional configuration
 */
export function createLogger(name: string, options?: { level: string }): void {
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });
      const item = result[0].items[0] as ApiFunction;

      expect(item.parameters).toHaveLength(2);
      expect(item.parameters[0].optional).toBe(false);
      expect(item.parameters[1].optional).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('should parse a class with properties and methods', () => {
    const { file, cleanup } = createTempFile(`
/**
 * A simple counter class
 */
export class Counter {
	/**
	 * Current count value
	 */
	count: number = 0;

	/**
	 * Increment the counter
	 * @param amount - Amount to increment by
	 */
	increment(amount: number): void {
		this.count += amount;
	}
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });
      const item = result[0].items[0] as ApiClass;

      expect(item.kind).toBe('class');
      expect(item.name).toBe('Counter');
      expect(item.description).toBe('A simple counter class');
      expect(item.properties).toHaveLength(1);
      expect(item.properties[0].name).toBe('count');
      expect(item.properties[0].type).toBe('number');
      expect(item.methods).toHaveLength(1);
      expect(item.methods[0].name).toBe('increment');
    } finally {
      cleanup();
    }
  });

  it('should parse an interface', () => {
    const { file, cleanup } = createTempFile(`
/**
 * User configuration interface
 */
export interface UserConfig {
	/**
	 * User name
	 */
	name: string;

	/**
	 * User age (optional)
	 */
	age?: number;
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });
      const item = result[0].items[0] as ApiInterface;

      expect(item.kind).toBe('interface');
      expect(item.name).toBe('UserConfig');
      expect(item.properties).toHaveLength(2);
      expect(item.properties[0].optional).toBe(false);
      expect(item.properties[1].optional).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('should parse a type alias', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Result type for API calls
 */
export type ApiResult = { success: true; data: string } | { success: false; error: string };
		`);

    try {
      const result = parseApi({ entryPoints: [file] });
      const item = result[0].items[0] as ApiTypeAlias;

      expect(item.kind).toBe('type');
      expect(item.name).toBe('ApiResult');
      expect(item.description).toBe('Result type for API calls');
    } finally {
      cleanup();
    }
  });

  it('should parse an enum', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Log levels
 */
export enum LogLevel {
	/**
	 * Debug messages
	 */
	DEBUG = 'debug',
	/**
	 * Info messages
	 */
	INFO = 'info',
	/**
	 * Error messages
	 */
	ERROR = 'error'
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });
      const item = result[0].items[0] as ApiEnum;

      expect(item.kind).toBe('enum');
      expect(item.name).toBe('LogLevel');
      expect(item.members).toHaveLength(3);
      expect(item.members[0].name).toBe('DEBUG');
      expect(item.members[0].value).toBe('debug');
      expect(item.members[0].description).toBe('Debug messages');
    } finally {
      cleanup();
    }
  });

  it('should parse JSDoc @example tags', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Add two numbers
 * @param a - First number
 * @param b - Second number
 * @returns Sum of a and b
 * @example
 * add(1, 2) // returns 3
 * @example
 * add(10, 20) // returns 30
 */
export function add(a: number, b: number): number {
	return a + b;
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });
      const item = result[0].items[0] as ApiFunction;

      expect(item.examples).toHaveLength(2);
      expect(item.examples[0].code).toContain('add(1, 2)');
      expect(item.examples[1].code).toContain('add(10, 20)');
    } finally {
      cleanup();
    }
  });

  it('should parse metadata tags (@deprecated, @since, @experimental)', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Old function
 * @deprecated Use newFunction() instead
 * @since 1.0.0
 */
export function oldFunction(): void {}

/**
 * Experimental feature
 * @experimental
 */
export function experimentalFunction(): void {}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });

      const oldFunc = result[0].items[0] as ApiFunction;
      expect(oldFunc.metadata.deprecated).toBe('Use newFunction() instead');
      expect(oldFunc.metadata.since).toBe('1.0.0');

      const expFunc = result[0].items[1] as ApiFunction;
      expect(expFunc.metadata.experimental).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('should parse @category tag for grouping', () => {
    const { file, cleanup } = createTempFile(`
/**
 * String utility
 * @category Utilities
 */
export function trim(str: string): string {
	return str.trim();
}

/**
 * Number utility
 * @category Utilities
 */
export function round(num: number): number {
	return Math.round(num);
}

/**
 * Parse function
 * @category Parsers
 */
export function parse(input: string): void {}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });

      expect(result[0].items[0].metadata.category).toBe('Utilities');
      expect(result[0].items[1].metadata.category).toBe('Utilities');
      expect(result[0].items[2].metadata.category).toBe('Parsers');
    } finally {
      cleanup();
    }
  });

  it('should handle generic type parameters', () => {
    const { file, cleanup } = createTempFile(`
/**
 * Generic map function
 */
export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
	return items.map(fn);
}

/**
 * Generic container
 */
export class Container<T> {
	value: T;
	constructor(value: T) {
		this.value = value;
	}
}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });

      const mapFunc = result[0].items[0] as ApiFunction;
      expect(mapFunc.typeParameters).toEqual(['T', 'U']);

      const container = result[0].items[1] as ApiClass;
      expect(container.typeParameters).toEqual(['T']);
    } finally {
      cleanup();
    }
  });

  it('should exclude files based on exclude patterns', () => {
    const { file, cleanup } = createTempFile(`
export function shouldBeExcluded(): void {}
		`);

    try {
      const result = parseApi({
        entryPoints: [file],
        exclude: ['test.ts'],
      });

      expect(result).toHaveLength(0);
    } finally {
      cleanup();
    }
  });

  it('should only parse exported declarations', () => {
    const { file, cleanup } = createTempFile(`
// Not exported - should be ignored
function privateFunction(): void {}

// Exported - should be parsed
export function publicFunction(): void {}
		`);

    try {
      const result = parseApi({ entryPoints: [file] });

      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0].name).toBe('publicFunction');
    } finally {
      cleanup();
    }
  });
});
