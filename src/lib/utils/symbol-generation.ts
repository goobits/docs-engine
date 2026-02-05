/**
 * TypeScript Symbol Map Generation
 *
 * Extracts exported symbols (types, interfaces, classes, functions, etc.)
 * from TypeScript source files and generates a symbol map for documentation.
 *
 * Features:
 * - Intelligent caching based on file content hashes
 * - JSDoc extraction for documentation
 * - Related symbol detection
 * - Type inheritance tracking (extends/implements)
 */

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import crypto from 'crypto';
import { glob } from 'glob';
import { createLogger } from './logger.js';

const logger = createLogger('symbol-generation');

/**
 * TypeScript JSDoc comment part (text or link)
 */
interface JSDocCommentPart {
  text?: string;
}

/**
 * JSDoc comment type - can be string or array of comment parts
 */
type JSDocComment = string | JSDocCommentPart[];

/**
 * TypeScript JSDoc tag structure
 */
interface JSDocTag {
  tagName: { text: string };
  name?: { text: string };
  comment?: JSDocComment;
  typeExpression?: {
    type?: ts.TypeNode;
  };
}

/**
 * TypeScript JSDoc structure
 */
interface JSDocNode {
  comment?: JSDocComment;
  tags?: JSDocTag[];
}

/**
 * Node with JSDoc comments attached
 */
interface NodeWithJSDoc extends ts.Node {
  jsDoc?: JSDocNode[];
}

/**
 * Configuration for symbol map generation
 */
export interface SymbolGeneratorConfig {
  /** Glob patterns for source files to scan */
  sourcePatterns: string[];
  /** Glob patterns for files to exclude */
  excludePatterns: string[];
  /** Directory for cache file */
  cacheDir: string;
  /** Cache version (increment to invalidate all caches) */
  cacheVersion: string;
  /** Output file path for symbol-map.json */
  outputPath: string;
  /** Base directory for resolving relative paths (default: process.cwd()) */
  baseDir?: string;
}

/**
 * Symbol definition extracted from TypeScript source
 */
export interface SymbolDefinition {
  name: string;
  path: string;
  line: number;
  kind: 'type' | 'interface' | 'class' | 'function' | 'enum' | 'const';
  exported: boolean;
  jsDoc?: {
    description?: string;
    params?: Array<{ name: string; description: string; type: string }>;
    returns?: string;
    example?: string;
    see?: string[];
  };
  signature: string;
  related?: string[]; // Related symbol names extracted from type signatures
  extends?: string[]; // Parent types/interfaces this symbol extends
  implements?: string[]; // Interfaces this class implements
}

/**
 * Map of symbol names to their definitions
 */
export interface SymbolMap {
  [symbolName: string]: SymbolDefinition[];
}

/**
 * Cached entry for a single file
 */
interface CachedFileEntry {
  mtime: number;
  size: number;
  hash: string;
  symbols: SymbolDefinition[];
}

/**
 * Cache structure
 */
interface SymbolCache {
  version: string;
  files: {
    [filePath: string]: CachedFileEntry;
  };
}

/**
 * Symbol map generator with intelligent caching
 */
export class SymbolMapGenerator {
  private config: Required<SymbolGeneratorConfig>;
  private cacheFile: string;

  constructor(config: SymbolGeneratorConfig) {
    this.config = {
      ...config,
      baseDir: config.baseDir || process.cwd(),
    };
    this.cacheFile = path.join(this.config.cacheDir, 'symbol-cache.json');
  }

  /**
   * Generate symbol map from TypeScript source files
   */
  async generate(): Promise<SymbolMap> {
    const startTime = Date.now();
    logger.info('Scanning TypeScript files...');

    // Load cache
    const cache = this.loadCache();
    const newCache: SymbolCache = { version: this.config.cacheVersion, files: {} };

    // Use Object.create(null) to avoid prototype pollution issues
    const symbolMap: SymbolMap = Object.create(null);
    let cacheHits = 0;
    let cacheMisses = 0;

    // Find all TypeScript files matching patterns
    const allFiles = await this.findSourceFiles();
    logger.info({ fileCount: allFiles.length }, 'Found TypeScript files');

    for (const relativeFile of allFiles) {
      const filePath = path.resolve(this.config.baseDir, relativeFile);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      // Check cache
      const cachedEntry = cache.files[relativeFile];
      const fileChanged = this.hasFileChanged(filePath, cachedEntry);

      if (!fileChanged && cachedEntry) {
        // Use cached symbols
        cacheHits++;
        logger.debug({ file: relativeFile }, 'Using cached symbols');

        // Add cached symbols to the symbol map
        for (const symbol of cachedEntry.symbols) {
          if (!Object.prototype.hasOwnProperty.call(symbolMap, symbol.name)) {
            symbolMap[symbol.name] = [];
          }
          symbolMap[symbol.name].push(symbol);
        }

        // Copy cache entry to new cache
        newCache.files[relativeFile] = cachedEntry;
        continue;
      }

      // File changed or not in cache, process it
      cacheMisses++;
      logger.info({ file: relativeFile }, 'Processing file');

      const fileSymbols = this.extractSymbolsFromFile(filePath, relativeFile);

      // Add to symbol map
      for (const symbol of fileSymbols) {
        if (!Object.prototype.hasOwnProperty.call(symbolMap, symbol.name)) {
          symbolMap[symbol.name] = [];
        }
        symbolMap[symbol.name].push(symbol);
        logger.debug({ kind: symbol.kind, name: symbol.name }, 'Extracted symbol');
      }

      // Update cache for this file
      const stats = fs.statSync(filePath);
      newCache.files[relativeFile] = {
        mtime: stats.mtimeMs,
        size: stats.size,
        hash: this.hashFile(filePath),
        symbols: fileSymbols,
      };
    }

    // Save cache
    this.saveCache(newCache);

    // Write symbol map
    this.writeSymbolMap(symbolMap);

    // Print statistics
    this.printStatistics(symbolMap, allFiles.length, cacheHits, cacheMisses);

    const duration = Date.now() - startTime;
    logger.info({ durationMs: duration }, 'Symbol map generation complete');

    return symbolMap;
  }

  /**
   * Find all source files matching patterns
   */
  private async findSourceFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.sourcePatterns) {
      const files = await glob(pattern, {
        cwd: this.config.baseDir,
        ignore: this.config.excludePatterns,
        absolute: false,
        nodir: true,
      });

      // Extra safety: filter out any node_modules or dist that slipped through
      const filtered = files.filter(
        (f) => !f.includes('node_modules') && !f.includes('/dist/') && !f.includes('/.turbo/')
      );
      allFiles.push(...filtered);
    }

    return allFiles;
  }

  /**
   * Extract symbols from a TypeScript file
   */
  private extractSymbolsFromFile(filePath: string, relativeFile: string): SymbolDefinition[] {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

    const symbols: SymbolDefinition[] = [];

    const visit = (node: ts.Node): void => {
      // Only process exported declarations
      const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
      const hasExportModifier = modifiers?.some(
        (m: ts.Modifier) => m.kind === ts.SyntaxKind.ExportKeyword
      );

      if (!hasExportModifier) {
        ts.forEachChild(node, visit);
        return;
      }

      let symbol: SymbolDefinition | null = null;

      // Type alias: export type Foo = ...
      if (ts.isTypeAliasDeclaration(node)) {
        const related = this.extractRelatedSymbols(node, sourceFile);
        symbol = {
          name: node.name.text,
          path: relativeFile,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          kind: 'type',
          exported: true,
          jsDoc: this.extractJSDoc(node, sourceFile),
          signature: `type ${node.name.text} = ${node.type.getText(sourceFile)}`,
          related: related.length > 0 ? related : undefined,
        };
      }

      // Interface: export interface Foo { ... }
      else if (ts.isInterfaceDeclaration(node)) {
        const members = node.members.map((m) => m.getText(sourceFile)).join(';\n  ');
        const related = this.extractRelatedSymbols(node, sourceFile);

        // Extract extends clause
        const extendsTypes = node.heritageClauses
          ?.filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
          .flatMap((clause) => clause.types.map((t) => t.expression.getText(sourceFile)))
          .filter((name) => /^[A-Z]/.test(name));

        symbol = {
          name: node.name.text,
          path: relativeFile,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          kind: 'interface',
          exported: true,
          jsDoc: this.extractJSDoc(node, sourceFile),
          signature: `interface ${node.name.text} {\n  ${members}\n}`,
          related: related.length > 0 ? related : undefined,
          extends: extendsTypes && extendsTypes.length > 0 ? extendsTypes : undefined,
        };
      }

      // Class: export class Foo { ... }
      else if (ts.isClassDeclaration(node) && node.name) {
        // Extract extends clause
        const extendsTypes = node.heritageClauses
          ?.filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
          .flatMap((clause) => clause.types.map((t) => t.expression.getText(sourceFile)))
          .filter((name) => /^[A-Z]/.test(name));

        // Extract implements clause
        const implementsTypes = node.heritageClauses
          ?.filter((clause) => clause.token === ts.SyntaxKind.ImplementsKeyword)
          .flatMap((clause) => clause.types.map((t) => t.expression.getText(sourceFile)))
          .filter((name) => /^[A-Z]/.test(name));

        symbol = {
          name: node.name.text,
          path: relativeFile,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          kind: 'class',
          exported: true,
          jsDoc: this.extractJSDoc(node, sourceFile),
          signature: `class ${node.name.text}`,
          extends: extendsTypes && extendsTypes.length > 0 ? extendsTypes : undefined,
          implements: implementsTypes && implementsTypes.length > 0 ? implementsTypes : undefined,
        };
      }

      // Function: export function foo() { ... }
      else if (ts.isFunctionDeclaration(node) && node.name) {
        const params = node.parameters.map((p) => p.getText(sourceFile)).join(', ');
        const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
        const related = this.extractRelatedSymbols(node, sourceFile);
        symbol = {
          name: node.name.text,
          path: relativeFile,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          kind: 'function',
          exported: true,
          jsDoc: this.extractJSDoc(node, sourceFile),
          signature: `function ${node.name.text}(${params})${returnType}`,
          related: related.length > 0 ? related : undefined,
        };
      }

      // Enum: export enum Foo { ... }
      else if (ts.isEnumDeclaration(node)) {
        symbol = {
          name: node.name.text,
          path: relativeFile,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          kind: 'enum',
          exported: true,
          jsDoc: this.extractJSDoc(node, sourceFile),
          signature: `enum ${node.name.text}`,
        };
      }

      // Variable statement with const: export const FOO = ...
      else if (ts.isVariableStatement(node)) {
        // Variable statements can contain multiple declarations
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            const varName = declaration.name.text;
            const typeAnnotation = declaration.type
              ? `: ${declaration.type.getText(sourceFile)}`
              : '';
            const initializer = declaration.initializer
              ? ` = ${declaration.initializer.getText(sourceFile).slice(0, 100)}${
                  declaration.initializer.getText(sourceFile).length > 100 ? '...' : ''
                }`
              : '';

            const constKeyword = node.declarationList.flags & ts.NodeFlags.Const ? 'const' : 'let';

            const constSymbol: SymbolDefinition = {
              name: varName,
              path: relativeFile,
              line: sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1,
              kind: 'const',
              exported: true,
              jsDoc: this.extractJSDoc(node, sourceFile),
              signature: `${constKeyword} ${varName}${typeAnnotation}${initializer}`,
            };

            symbols.push(constSymbol);
          }
        }
      }

      if (symbol) {
        symbols.push(symbol);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return symbols;
  }

  /**
   * Extract related symbol names from a type node
   */
  private extractRelatedSymbols(node: ts.Node, sourceFile: ts.SourceFile): string[] {
    const related = new Set<string>();

    const visitType = (typeNode: ts.Node): void => {
      // Type reference: Foo, Bar<T>, etc.
      if (ts.isTypeReferenceNode(typeNode)) {
        const typeName = typeNode.typeName.getText(sourceFile);
        // Only include capitalized types (filters out primitives)
        if (/^[A-Z]/.test(typeName)) {
          related.add(typeName);
        }
      }

      // Union/intersection types
      if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
        typeNode.types.forEach(visitType);
      }

      // Array types
      if (ts.isArrayTypeNode(typeNode)) {
        visitType(typeNode.elementType);
      }

      ts.forEachChild(typeNode, visitType);
    };

    // Extract from function parameters and return type
    if (ts.isFunctionDeclaration(node) || ts.isFunctionTypeNode(node)) {
      (node as ts.FunctionLikeDeclaration).parameters.forEach((param) => {
        if (param.type) {
          visitType(param.type);
        }
      });

      const returnType = (node as ts.FunctionLikeDeclaration).type;
      if (returnType) {
        visitType(returnType);
      }
    }

    // Extract from type alias
    if (ts.isTypeAliasDeclaration(node)) {
      visitType(node.type);
    }

    // Extract from interface properties
    if (ts.isInterfaceDeclaration(node)) {
      node.members.forEach((member) => {
        if (ts.isPropertySignature(member) && member.type) {
          visitType(member.type);
        }
      });
    }

    return Array.from(related);
  }

  /**
   * Extract JSDoc comments from a node
   */
  private extractJSDoc(node: ts.Node, sourceFile: ts.SourceFile): SymbolDefinition['jsDoc'] {
    const jsDocComments = (node as NodeWithJSDoc).jsDoc;
    if (!jsDocComments || jsDocComments.length === 0) return undefined;

    const jsDoc = jsDocComments[0];
    const description = jsDoc.comment || '';

    // Helper to normalize comment text
    const normalizeComment = (comment: JSDocComment | undefined): string => {
      if (!comment) return '';
      if (typeof comment === 'string') return comment;
      if (Array.isArray(comment)) {
        return comment.map((c: JSDocCommentPart) => c.text || '').join('');
      }
      return String(comment);
    };

    // Collect all @example tags
    const exampleTags = jsDoc.tags?.filter((t: JSDocTag) => t.tagName.text === 'example') || [];
    const examples = exampleTags.map((t: JSDocTag) => normalizeComment(t.comment)).filter(Boolean);

    // Collect all @see tags
    const seeTags = jsDoc.tags?.filter((t: JSDocTag) => t.tagName.text === 'see') || [];
    const seeReferences = seeTags.map((t: JSDocTag) => normalizeComment(t.comment)).filter(Boolean);

    return {
      description: normalizeComment(description),
      params: jsDoc.tags
        ?.filter((t: JSDocTag) => t.tagName.text === 'param')
        .map((t: JSDocTag) => ({
          name: t.name?.text || '',
          description: normalizeComment(t.comment),
          type: t.typeExpression?.type?.getText(sourceFile) || 'unknown',
        })),
      returns: normalizeComment(
        jsDoc.tags?.find((t: JSDocTag) => t.tagName.text === 'returns')?.comment
      ),
      example: examples.length > 0 ? examples.join('\n\n') : undefined,
      see: seeReferences.length > 0 ? seeReferences : undefined,
    };
  }

  /**
   * Load cache from disk
   */
  private loadCache(): SymbolCache {
    if (!fs.existsSync(this.cacheFile)) {
      return { version: this.config.cacheVersion, files: {} };
    }

    try {
      const cacheData = fs.readFileSync(this.cacheFile, 'utf-8');
      const cache = JSON.parse(cacheData) as SymbolCache;

      // Invalidate cache if version mismatch
      if (cache.version !== this.config.cacheVersion) {
        logger.warn(
          { expected: this.config.cacheVersion, found: cache.version },
          'Cache version mismatch, invalidating cache'
        );
        return { version: this.config.cacheVersion, files: {} };
      }

      return cache;
    } catch (error) {
      logger.warn({ error }, 'Failed to load cache, starting fresh');
      return { version: this.config.cacheVersion, files: {} };
    }
  }

  /**
   * Save cache to disk
   */
  private saveCache(cache: SymbolCache): void {
    fs.mkdirSync(this.config.cacheDir, { recursive: true });
    fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
  }

  /**
   * Compute hash of file contents
   */
  private hashFile(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Check if a file has changed since it was cached
   */
  private hasFileChanged(filePath: string, cachedEntry: CachedFileEntry | undefined): boolean {
    if (!cachedEntry) return true;

    const stats = fs.statSync(filePath);

    // Quick check: mtime and size
    if (stats.mtimeMs !== cachedEntry.mtime || stats.size !== cachedEntry.size) {
      return true;
    }

    // Slower check: content hash
    const currentHash = this.hashFile(filePath);
    return currentHash !== cachedEntry.hash;
  }

  /**
   * Write symbol map to disk
   */
  private writeSymbolMap(symbolMap: SymbolMap): void {
    const outputDir = path.dirname(this.config.outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(this.config.outputPath, JSON.stringify(symbolMap, null, 2), 'utf-8');
  }

  /**
   * Print generation statistics
   */
  private printStatistics(
    symbolMap: SymbolMap,
    totalFiles: number,
    cacheHits: number,
    cacheMisses: number
  ): void {
    const symbolCount = Object.values(symbolMap).flat().length;
    const cacheHitRate = ((cacheHits / totalFiles) * 100).toFixed(1);
    const cacheMissRate = ((cacheMisses / totalFiles) * 100).toFixed(1);

    logger.info(
      {
        symbolCount,
        uniqueNames: Object.keys(symbolMap).length,
        outputPath: this.config.outputPath,
        cacheHits,
        cacheMisses,
        cacheHitRate: `${cacheHitRate}%`,
        cacheMissRate: `${cacheMissRate}%`,
        cacheFile: this.cacheFile,
      },
      'Symbol map generation complete'
    );

    // Disambiguation stats
    const ambiguous = Object.entries(symbolMap).filter(([_, defs]) => defs.length > 1);
    if (ambiguous.length > 0) {
      const ambiguousSymbols = ambiguous.slice(0, 5).map(([name, defs]) => ({
        name,
        definitionCount: defs.length,
      }));
      logger.warn(
        {
          ambiguousCount: ambiguous.length,
          examples: ambiguousSymbols,
          additionalCount: Math.max(0, ambiguous.length - 5),
        },
        'Symbols require disambiguation'
      );
    }
  }

  /**
   * Watch source files and automatically regenerate symbol map on changes
   *
   * @param options - Watch options
   * @returns Watcher instance that can be closed
   *
   * @example
   * ```typescript
   * const watcher = await generator.watch({
   *   debounce: 500,
   *   onChange: (stats) => console.log(`Updated: ${stats.symbolCount} symbols`)
   * });
   *
   * // Later: watcher.close()
   * ```
   */
  async watch(options?: {
    debounce?: number;
    onChange?: (stats: { symbolCount: number; duration: number; files: string[] }) => void;
  }): Promise<{ close: () => Promise<void> }> {
    const { debounce = 500, onChange } = options || {};

    // Dynamic import to avoid requiring chokidar for non-watch use cases
    const chokidar = await import('chokidar');

    let debounceTimer: NodeJS.Timeout | null = null;
    let isRegenerating = false;
    const pendingFiles = new Set<string>();

    const regenerate = async (): Promise<void> => {
      if (isRegenerating) {
        logger.debug('Regeneration already in progress, queuing...');
        return;
      }

      isRegenerating = true;
      const startTime = Date.now();
      const fileList = Array.from(pendingFiles);
      pendingFiles.clear();

      logger.info(
        {
          fileCount: fileList.length,
          files:
            fileList.length <= 3
              ? fileList
              : [...fileList.slice(0, 3), `... and ${fileList.length - 3} more`],
        },
        'Regenerating symbol map'
      );

      try {
        const symbolMap = await this.generate();
        const duration = Date.now() - startTime;
        const symbolCount = Object.values(symbolMap).flat().length;

        logger.info(
          {
            duration,
            durationSeconds: (duration / 1000).toFixed(1),
            symbolCount,
          },
          'Symbol map updated'
        );

        if (onChange) {
          onChange({ symbolCount, duration, files: fileList });
        }
      } catch (error) {
        logger.error({ error }, 'Error regenerating symbol map, continuing to watch');
      } finally {
        isRegenerating = false;
      }

      logger.info('Watching TypeScript files for changes...');
    };

    const handleFileChange = (filePath: string): void => {
      // Only process TypeScript files, skip test files
      if (
        !filePath.endsWith('.ts') ||
        filePath.endsWith('.test.ts') ||
        filePath.endsWith('.spec.ts')
      ) {
        return;
      }

      const relativePath = path.relative(this.config.baseDir, filePath);
      pendingFiles.add(relativePath);

      logger.debug({ file: relativePath }, 'File changed');

      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer for debounce
      debounceTimer = setTimeout(() => {
        regenerate();
      }, debounce);
    };

    // Calculate watch directories from source patterns
    const watchDirs = this.config.sourcePatterns.map((pattern) => {
      // Extract directory from glob pattern (e.g., "src/lib/**/*.ts" -> "src/lib")
      const dir = pattern.split('*')[0].replace(/\/$/, '');
      return path.resolve(this.config.baseDir, dir);
    });

    logger.info(
      {
        directories: watchDirs.map((dir) => path.relative(this.config.baseDir, dir)),
      },
      'Starting TypeScript file watcher'
    );

    const watcher = chokidar.watch(watchDirs, {
      ignored: this.config.excludePatterns,
      persistent: true,
      ignoreInitial: true,
      cwd: this.config.baseDir,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
      usePolling: true, // Required for Docker environments
      interval: 1000,
      binaryInterval: 3000,
    });

    watcher
      .on('ready', () => {
        logger.info('Watching TypeScript files for changes (Press Ctrl+C to stop)');
      })
      .on('change', handleFileChange)
      .on('add', handleFileChange)
      .on('unlink', (filePath) => {
        if (
          !filePath.endsWith('.ts') ||
          filePath.endsWith('.test.ts') ||
          filePath.endsWith('.spec.ts')
        ) {
          return;
        }

        const relativePath = path.relative(this.config.baseDir, filePath);
        logger.debug({ file: relativePath }, 'File deleted');
        pendingFiles.add(relativePath);

        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
          regenerate();
        }, debounce);
      })
      .on('error', (error) => {
        logger.error({ error }, 'Watcher error');
      });

    return {
      close: async (): Promise<void> => {
        logger.info('Stopping file watcher...');
        await watcher.close();
        logger.info('File watcher stopped');
      },
    };
  }

  /**
   * Benchmark symbol map generation performance
   *
   * @returns Benchmark results
   *
   * @example
   * ```typescript
   * const results = await generator.benchmark();
   * console.log(`Cold: ${results.cold}ms, Warm: ${results.warm}ms`);
   * ```
   */
  async benchmark(): Promise<{
    cold: number;
    warm: number;
    warmWithChange: number;
    improvement: number;
    cacheSize: number;
  }> {
    logger.info('Starting symbol map generation benchmark');

    // Test 1: Cold run (no cache)
    logger.info('Running cold benchmark (no cache)');
    if (fs.existsSync(this.cacheFile)) {
      fs.unlinkSync(this.cacheFile);
    }
    const coldStart = Date.now();
    await this.generate();
    const coldTime = Date.now() - coldStart;
    logger.info(
      {
        duration: coldTime,
        durationSeconds: (coldTime / 1000).toFixed(2),
      },
      'Cold run complete'
    );

    // Test 2: Warm run (with cache, no changes)
    logger.info('Running warm benchmark (cache, no changes)');
    const warmStart = Date.now();
    await this.generate();
    const warmTime = Date.now() - warmStart;
    logger.info(
      {
        duration: warmTime,
        durationSeconds: (warmTime / 1000).toFixed(2),
      },
      'Warm run (no changes) complete'
    );

    // Test 3: Warm run (with cache, 1 file changed)
    logger.info('Running warm benchmark (cache, 1 file changed)');
    const files = await this.findSourceFiles();
    if (files.length > 0) {
      const testFile = path.resolve(this.config.baseDir, files[0]);
      if (fs.existsSync(testFile)) {
        const now = new Date();
        fs.utimesSync(testFile, now, now);
      }
    }
    const modifiedStart = Date.now();
    await this.generate();
    const modifiedTime = Date.now() - modifiedStart;
    logger.info(
      {
        duration: modifiedTime,
        durationSeconds: (modifiedTime / 1000).toFixed(2),
      },
      'Warm run (1 change) complete'
    );

    // Summary
    const improvement = ((1 - warmTime / coldTime) * 100).toFixed(1);
    const targetAchieved = warmTime < 1000;

    // Check cache file size
    let cacheSize = 0;
    if (fs.existsSync(this.cacheFile)) {
      const stats = fs.statSync(this.cacheFile);
      cacheSize = stats.size;
    }

    logger.info(
      {
        coldRun: {
          duration: coldTime,
          durationSeconds: (coldTime / 1000).toFixed(2),
        },
        warmRunNoChange: {
          duration: warmTime,
          durationSeconds: (warmTime / 1000).toFixed(2),
        },
        warmRunOneChange: {
          duration: modifiedTime,
          durationSeconds: (modifiedTime / 1000).toFixed(2),
        },
        improvement: `${improvement}%`,
        targetAchieved,
        cacheSizeKB: (cacheSize / 1024).toFixed(2),
      },
      'Benchmark complete'
    );

    return {
      cold: coldTime,
      warm: warmTime,
      warmWithChange: modifiedTime,
      improvement: parseFloat(improvement),
      cacheSize,
    };
  }
}

/**
 * Create a symbol map generator instance
 *
 * @example
 * ```typescript
 * import { createSymbolMapGenerator, getVersion } from '@goobits/docs-engine/utils';
 *
 * const generator = createSymbolMapGenerator({
 *   sourcePatterns: ['src/**\/*.ts'],
 *   excludePatterns: ['**\/*.test.ts'],
 *   cacheDir: '.dev/tmp',
 *   cacheVersion: getVersion(), // Use package.json version for cache invalidation
 *   outputPath: 'docs/.generated/symbol-map.json'
 * });
 *
 * await generator.generate();
 * // Or watch for changes:
 * const watcher = await generator.watch();
 * // Or benchmark:
 * const results = await generator.benchmark();
 * ```
 */
export function createSymbolMapGenerator(config: SymbolGeneratorConfig): SymbolMapGenerator {
  return new SymbolMapGenerator(config);
}
