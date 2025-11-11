/**
 * Tests for API parser
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseApi } from './api-parser';
import type { ApiFunction, ApiClass, ApiInterface, ApiTypeAlias, ApiEnum } from './api-parser';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('API Parser', () => {
  // Shared temp directory and fixture files
  let tempDir: string;
  let fixtures: {
    simpleFunctionFile: string;
    optionalParamsFile: string;
    classFile: string;
    interfaceFile: string;
    typeAliasFile: string;
    enumFile: string;
    exampleTagsFile: string;
    metadataTagsFile: string;
    categoryTagFile: string;
    genericsFile: string;
    excludeFile: string;
    exportedOnlyFile: string;
  };

  // Create all fixture files once before all tests
  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'api-parser-test-'));

    fixtures = {
      simpleFunctionFile: join(tempDir, 'simple-function.ts'),
      optionalParamsFile: join(tempDir, 'optional-params.ts'),
      classFile: join(tempDir, 'class.ts'),
      interfaceFile: join(tempDir, 'interface.ts'),
      typeAliasFile: join(tempDir, 'type-alias.ts'),
      enumFile: join(tempDir, 'enum.ts'),
      exampleTagsFile: join(tempDir, 'example-tags.ts'),
      metadataTagsFile: join(tempDir, 'metadata-tags.ts'),
      categoryTagFile: join(tempDir, 'category-tag.ts'),
      genericsFile: join(tempDir, 'generics.ts'),
      excludeFile: join(tempDir, 'test.ts'), // Must be named 'test.ts' for exclude test
      exportedOnlyFile: join(tempDir, 'exported-only.ts'),
    };

    // Write all fixture files
    writeFileSync(
      fixtures.simpleFunctionFile,
      `
/**
 * Parse YAML frontmatter from markdown files
 * @param markdown - Markdown content with frontmatter
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(markdown: string): string {
	return markdown;
}
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.optionalParamsFile,
      `
/**
 * Create a logger
 * @param name - Logger name
 * @param options - Optional configuration
 */
export function createLogger(name: string, options?: { level: string }): void {
}
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.classFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.interfaceFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.typeAliasFile,
      `
/**
 * Result type for API calls
 */
export type ApiResult = { success: true; data: string } | { success: false; error: string };
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.enumFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.exampleTagsFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.metadataTagsFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.categoryTagFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.genericsFile,
      `
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
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.excludeFile,
      `
export function shouldBeExcluded(): void {}
		`,
      'utf-8'
    );

    writeFileSync(
      fixtures.exportedOnlyFile,
      `
// Not exported - should be ignored
function privateFunction(): void {}

// Exported - should be parsed
export function publicFunction(): void {}
		`,
      'utf-8'
    );
  });

  // Clean up all fixtures once after all tests
  afterAll(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should parse a simple function', () => {
    const result = parseApi({ entryPoints: [fixtures.simpleFunctionFile] });

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
  });

  it('should parse function with optional parameters', () => {
    const result = parseApi({ entryPoints: [fixtures.optionalParamsFile] });
    const item = result[0].items[0] as ApiFunction;

    expect(item.parameters).toHaveLength(2);
    expect(item.parameters[0].optional).toBe(false);
    expect(item.parameters[1].optional).toBe(true);
  });

  it('should parse a class with properties and methods', () => {
    const result = parseApi({ entryPoints: [fixtures.classFile] });
    const item = result[0].items[0] as ApiClass;

    expect(item.kind).toBe('class');
    expect(item.name).toBe('Counter');
    expect(item.description).toBe('A simple counter class');
    expect(item.properties).toHaveLength(1);
    expect(item.properties[0].name).toBe('count');
    expect(item.properties[0].type).toBe('number');
    expect(item.methods).toHaveLength(1);
    expect(item.methods[0].name).toBe('increment');
  });

  it('should parse an interface', () => {
    const result = parseApi({ entryPoints: [fixtures.interfaceFile] });
    const item = result[0].items[0] as ApiInterface;

    expect(item.kind).toBe('interface');
    expect(item.name).toBe('UserConfig');
    expect(item.properties).toHaveLength(2);
    expect(item.properties[0].optional).toBe(false);
    expect(item.properties[1].optional).toBe(true);
  });

  it('should parse a type alias', () => {
    const result = parseApi({ entryPoints: [fixtures.typeAliasFile] });
    const item = result[0].items[0] as ApiTypeAlias;

    expect(item.kind).toBe('type');
    expect(item.name).toBe('ApiResult');
    expect(item.description).toBe('Result type for API calls');
  });

  it('should parse an enum', () => {
    const result = parseApi({ entryPoints: [fixtures.enumFile] });
    const item = result[0].items[0] as ApiEnum;

    expect(item.kind).toBe('enum');
    expect(item.name).toBe('LogLevel');
    expect(item.members).toHaveLength(3);
    expect(item.members[0].name).toBe('DEBUG');
    expect(item.members[0].value).toBe('debug');
    expect(item.members[0].description).toBe('Debug messages');
  });

  it('should parse JSDoc @example tags', () => {
    const result = parseApi({ entryPoints: [fixtures.exampleTagsFile] });
    const item = result[0].items[0] as ApiFunction;

    expect(item.examples).toHaveLength(2);
    expect(item.examples[0].code).toContain('add(1, 2)');
    expect(item.examples[1].code).toContain('add(10, 20)');
  });

  it('should parse metadata tags (@deprecated, @since, @experimental)', () => {
    const result = parseApi({ entryPoints: [fixtures.metadataTagsFile] });

    const oldFunc = result[0].items[0] as ApiFunction;
    expect(oldFunc.metadata.deprecated).toBe('Use newFunction() instead');
    expect(oldFunc.metadata.since).toBe('1.0.0');

    const expFunc = result[0].items[1] as ApiFunction;
    expect(expFunc.metadata.experimental).toBe(true);
  });

  it('should parse @category tag for grouping', () => {
    const result = parseApi({ entryPoints: [fixtures.categoryTagFile] });

    expect(result[0].items[0].metadata.category).toBe('Utilities');
    expect(result[0].items[1].metadata.category).toBe('Utilities');
    expect(result[0].items[2].metadata.category).toBe('Parsers');
  });

  it('should handle generic type parameters', () => {
    const result = parseApi({ entryPoints: [fixtures.genericsFile] });

    const mapFunc = result[0].items[0] as ApiFunction;
    expect(mapFunc.typeParameters).toEqual(['T', 'U']);

    const container = result[0].items[1] as ApiClass;
    expect(container.typeParameters).toEqual(['T']);
  });

  it('should exclude files based on exclude patterns', () => {
    const result = parseApi({
      entryPoints: [fixtures.excludeFile],
      exclude: ['test.ts'],
    });

    expect(result).toHaveLength(0);
  });

  it('should only parse exported declarations', () => {
    const result = parseApi({ entryPoints: [fixtures.exportedOnlyFile] });

    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].name).toBe('publicFunction');
  });
});
