import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createSymbolMapGenerator,
  SymbolMapGenerator,
  type SymbolGeneratorConfig,
  type SymbolMap,
  type SymbolDefinition,
} from './symbol-generation';

/**
 * Integration tests for the TypeScript symbol map generator.
 *
 * These tests exercise real behavior end-to-end: they write tiny `.ts` source
 * files into a throwaway temp directory, run the generator against them with the
 * TypeScript compiler API, and assert on the produced symbol map / cache files.
 */
describe('symbol-generation', () => {
  let rootDir: string;
  let sourceDir: string;
  let cacheDir: string;
  let outputPath: string;

  // The single source file used by most tests, exercising every supported kind.
  const SAMPLE_FILE = 'sample.ts';
  const SAMPLE_SOURCE = `
/**
 * Adds two numbers together.
 *
 * @param a - the first addend
 * @param {number} b the second addend
 * @returns the arithmetic sum
 * @example
 * add(1, 2) // => 3
 * @see related SomeHelper
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Shape of a user record.
 */
export interface User extends Base {
  id: string;
  profile: Profile;
}

export class Service extends BaseService implements Loggable {
  run(): void {}
}

export type Status = 'active' | 'inactive';

export enum Color {
  Red,
  Green,
}

/**
 * The application name.
 */
export const APP_NAME: string = 'docs-engine';

// Not exported -> must be ignored by the generator.
function internalHelper(): void {}
const INTERNAL = 42;
`;

  /** Build a generator config pointed at the temp dirs created in beforeEach. */
  function makeConfig(overrides: Partial<SymbolGeneratorConfig> = {}): SymbolGeneratorConfig {
    return {
      sourcePatterns: ['*.ts'],
      excludePatterns: ['**/*.test.ts'],
      cacheDir,
      cacheVersion: '1.0.0',
      outputPath,
      baseDir: sourceDir,
      ...overrides,
    };
  }

  /** Helper: find the single definition for a symbol name (asserts uniqueness). */
  function one(map: SymbolMap, name: string): SymbolDefinition {
    const defs = map[name];
    expect(defs, `expected symbol "${name}" to exist`).toBeDefined();
    expect(defs.length).toBe(1);
    return defs[0];
  }

  beforeEach(() => {
    // mkdtempSync yields a unique, non-colliding temp root each run.
    rootDir = mkdtempSync(join(tmpdir(), 'symgen-test-'));
    sourceDir = join(rootDir, 'src');
    cacheDir = join(rootDir, 'cache');
    outputPath = join(rootDir, 'out', 'symbol-map.json');
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(join(sourceDir, SAMPLE_FILE), SAMPLE_SOURCE, 'utf-8');
  });

  afterEach(() => {
    if (rootDir && existsSync(rootDir)) {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  describe('createSymbolMapGenerator', () => {
    it('returns a SymbolMapGenerator instance with a generate() method', () => {
      const generator = createSymbolMapGenerator(makeConfig());
      expect(generator).toBeInstanceOf(SymbolMapGenerator);
      expect(typeof generator.generate).toBe('function');
    });
  });

  describe('generate()', () => {
    it('extracts every exported symbol kind with the correct kind tag', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      expect(one(map, 'add').kind).toBe('function');
      expect(one(map, 'User').kind).toBe('interface');
      expect(one(map, 'Service').kind).toBe('class');
      expect(one(map, 'Status').kind).toBe('type');
      expect(one(map, 'Color').kind).toBe('enum');
      expect(one(map, 'APP_NAME').kind).toBe('const');
    });

    it('ignores non-exported declarations', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      expect(map.internalHelper).toBeUndefined();
      expect(map.INTERNAL).toBeUndefined();
    });

    it('marks extracted symbols as exported and records path + 1-based line number', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      const add = one(map, 'add');
      expect(add.exported).toBe(true);
      expect(add.path).toBe(SAMPLE_FILE);
      // `export function add` is on line 12 of SAMPLE_SOURCE (line index + 1).
      const expectedLine = SAMPLE_SOURCE.split('\n').findIndex((l) =>
        l.startsWith('export function add')
      );
      expect(add.line).toBe(expectedLine + 1);
    });

    it('builds readable signatures per kind', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      expect(one(map, 'add').signature).toBe('function add(a: number, b: number): number');
      expect(one(map, 'Status').signature).toBe("type Status = 'active' | 'inactive'");
      expect(one(map, 'Service').signature).toBe('class Service');
      expect(one(map, 'Color').signature).toBe('enum Color');
      expect(one(map, 'APP_NAME').signature).toBe("const APP_NAME: string = 'docs-engine'");

      const userSig = one(map, 'User').signature;
      expect(userSig.startsWith('interface User {')).toBe(true);
      expect(userSig).toContain('id: string');
      expect(userSig).toContain('profile: Profile');
    });

    it('captures JSDoc description, params, returns, example, and see tags', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      const add = one(map, 'add');
      expect(add.jsDoc).toBeDefined();
      expect(add.jsDoc?.description).toBe('Adds two numbers together.');

      const params = add.jsDoc?.params ?? [];
      expect(params).toHaveLength(2);
      // ACTUAL behavior: with the `@param a - text` form (no `{type}` block) the
      // TS compiler keeps the leading "- " in the comment and the generator
      // falls back to the literal string 'unknown' for the type.
      expect(params[0]).toMatchObject({
        name: 'a',
        description: '- the first addend',
        type: 'unknown',
      });
      // With an explicit `@param {number} b text` form the type IS captured and
      // the description has no leading dash.
      expect(params[1]).toMatchObject({
        name: 'b',
        description: 'the second addend',
        type: 'number',
      });

      expect(add.jsDoc?.returns).toBe('the arithmetic sum');
      expect(add.jsDoc?.example).toContain('add(1, 2)');

      // ACTUAL behavior of the TS JSDoc parser: for an `@see` tag the first
      // whitespace-delimited token is treated as a reference name and dropped
      // from the captured comment text. So `@see related SomeHelper` surfaces
      // as 'SomeHelper' (the leading 'related' token is consumed).
      expect(add.jsDoc?.see).toEqual(['SomeHelper']);
    });

    it('leaves jsDoc undefined for symbols without doc comments', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();
      // Status type alias has no JSDoc block.
      expect(one(map, 'Status').jsDoc).toBeUndefined();
    });

    it('extracts extends for interfaces and extends + implements for classes', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      expect(one(map, 'User').extends).toEqual(['Base']);

      const service = one(map, 'Service');
      expect(service.extends).toEqual(['BaseService']);
      expect(service.implements).toEqual(['Loggable']);
    });

    it('extracts related capitalized type references and filters out primitives', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      // Interface User references Profile (capitalized) but not `string`.
      const user = one(map, 'User');
      expect(user.related).toContain('Profile');
      expect(user.related).not.toContain('string');

      // `add` only references primitives -> no related array.
      expect(one(map, 'add').related).toBeUndefined();
    });

    it('writes the symbol map JSON to the configured output path', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      expect(existsSync(outputPath)).toBe(true);
      const written = JSON.parse(readFileSync(outputPath, 'utf-8'));
      expect(Object.keys(written).sort()).toEqual(Object.keys(map).sort());
      expect(written.add[0].kind).toBe('function');
    });

    it('returns a prototype-less map (no inherited Object keys leak in)', async () => {
      const map = await createSymbolMapGenerator(makeConfig()).generate();
      // Source uses Object.create(null); guard against accidental prototype pollution.
      expect(map.toString).toBeUndefined();
      expect(map.hasOwnProperty).toBeUndefined();
    });

    it('respects excludePatterns', async () => {
      writeFileSync(
        join(sourceDir, 'ignored.test.ts'),
        'export const SHOULD_NOT_APPEAR = 1;\n',
        'utf-8'
      );
      const map = await createSymbolMapGenerator(makeConfig()).generate();
      expect(map.SHOULD_NOT_APPEAR).toBeUndefined();
    });

    it('merges symbols from multiple source files into one map', async () => {
      writeFileSync(
        join(sourceDir, 'extra.ts'),
        'export function helper(): void {}\nexport const EXTRA = true;\n',
        'utf-8'
      );
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      expect(one(map, 'helper').kind).toBe('function');
      expect(one(map, 'helper').path).toBe('extra.ts');
      expect(one(map, 'EXTRA').kind).toBe('const');
      // Symbols from the original sample file are still present.
      expect(map.add).toBeDefined();
    });

    it('records duplicate symbol names as multiple definitions (disambiguation)', async () => {
      writeFileSync(
        join(sourceDir, 'dup.ts'),
        'export function add(x: string): string {\n  return x;\n}\n',
        'utf-8'
      );
      const map = await createSymbolMapGenerator(makeConfig()).generate();

      const defs = map.add;
      expect(defs.length).toBe(2);
      const paths = defs.map((d) => d.path).sort();
      expect(paths).toEqual(['dup.ts', SAMPLE_FILE].sort());
    });
  });

  describe('caching', () => {
    it('writes a cache file with the configured version', async () => {
      await createSymbolMapGenerator(makeConfig()).generate();

      const cacheFile = join(cacheDir, 'symbol-cache.json');
      expect(existsSync(cacheFile)).toBe(true);
      const cache = JSON.parse(readFileSync(cacheFile, 'utf-8'));
      expect(cache.version).toBe('1.0.0');
      expect(cache.files[SAMPLE_FILE]).toBeDefined();
      expect(cache.files[SAMPLE_FILE].hash).toMatch(/^[0-9a-f]{32}$/); // md5 hex
      expect(Array.isArray(cache.files[SAMPLE_FILE].symbols)).toBe(true);
    });

    it('produces a consistent map on a second run that reuses the cache', async () => {
      const generator = createSymbolMapGenerator(makeConfig());
      const first = await generator.generate();

      // Second run: file is unchanged, so symbols should be served from cache
      // and the resulting map must be deep-equal to the first run.
      const second = await generator.generate();
      expect(second).toEqual(first);

      // Cache entry should be carried forward unchanged.
      const cache = JSON.parse(readFileSync(join(cacheDir, 'symbol-cache.json'), 'utf-8'));
      expect(cache.files[SAMPLE_FILE].symbols.length).toBe(first.add.length + 5);
    });

    it('reflects edits to a source file on the next run', async () => {
      const generator = createSymbolMapGenerator(makeConfig());
      const before = await generator.generate();
      expect(before.newlyAdded).toBeUndefined();

      // Change file contents -> hash differs -> cache miss -> re-extract.
      writeFileSync(
        join(sourceDir, SAMPLE_FILE),
        SAMPLE_SOURCE + '\nexport const newlyAdded = 99;\n',
        'utf-8'
      );
      const after = await generator.generate();
      expect(one(after, 'newlyAdded').kind).toBe('const');
      expect(after.add).toBeDefined();
    });

    it('invalidates the cache when the cache version changes', async () => {
      // First run writes a v1 cache.
      await createSymbolMapGenerator(makeConfig({ cacheVersion: '1.0.0' })).generate();

      // Second run with a new version must rewrite the cache at the new version
      // rather than reusing the v1 entries.
      await createSymbolMapGenerator(makeConfig({ cacheVersion: '2.0.0' })).generate();
      const cache = JSON.parse(readFileSync(join(cacheDir, 'symbol-cache.json'), 'utf-8'));
      expect(cache.version).toBe('2.0.0');
    });
  });
});
