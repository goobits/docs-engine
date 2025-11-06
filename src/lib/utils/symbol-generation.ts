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
import fsp from 'fs/promises';
import path from 'path';
import * as ts from 'typescript';
import crypto from 'crypto';
import { glob } from 'glob';
import { FileIOError, ProcessingError, retryWithBackoff } from './errors.js';
import { createLogger } from './logger.js';

const logger = createLogger('symbol-generation');

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
	 *
	 * Performance note: The file-level cache (based on mtime/hash) significantly
	 * reduces processing time for unchanged files. Each file's AST is parsed once
	 * per generation run and cached to disk for subsequent runs.
	 */
	async generate(): Promise<SymbolMap> {
		const startTime = Date.now();
		logger.info('Scanning TypeScript files');

		// Load cache
		const cache = await this.loadCache();
		const newCache: SymbolCache = { version: this.config.cacheVersion, files: {} };

		// Use Object.create(null) to avoid prototype pollution issues
		const symbolMap: SymbolMap = Object.create(null);
		let symbolCount = 0;
		let cacheHits = 0;
		let cacheMisses = 0;

		// Find all TypeScript files matching patterns
		const allFiles = await this.findSourceFiles();
		logger.info({ fileCount: allFiles.length }, 'Found TypeScript files');

		for (const relativeFile of allFiles) {
			const filePath = path.resolve(this.config.baseDir, relativeFile);

			// Check if file exists
			try {
				await fsp.access(filePath);
			} catch {
				continue; // File doesn't exist, skip it
			}

			// Check cache
			const cachedEntry = cache.files[relativeFile];
			const fileChanged = await this.hasFileChanged(filePath, cachedEntry);

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
					symbolCount++;
				}

				// Copy cache entry to new cache
				newCache.files[relativeFile] = cachedEntry;
				continue;
			}

			// File changed or not in cache, process it
			cacheMisses++;
			logger.info({ file: relativeFile }, 'Processing file');

			const fileSymbols = await this.extractSymbolsFromFile(filePath, relativeFile);

			// Add to symbol map
			for (const symbol of fileSymbols) {
				if (!Object.prototype.hasOwnProperty.call(symbolMap, symbol.name)) {
					symbolMap[symbol.name] = [];
				}
				symbolMap[symbol.name].push(symbol);
				symbolCount++;
				logger.debug({ kind: symbol.kind, name: symbol.name }, 'Extracted symbol');
			}

			// Update cache for this file
			const stats = await fsp.stat(filePath);
			newCache.files[relativeFile] = {
				mtime: stats.mtimeMs,
				size: stats.size,
				hash: await this.hashFile(filePath),
				symbols: fileSymbols,
			};
		}

		// Save cache
		await this.saveCache(newCache);

		// Write symbol map
		await this.writeSymbolMap(symbolMap);

		// Print statistics
		const duration = Date.now() - startTime;
		this.printStatistics(symbolMap, allFiles.length, cacheHits, cacheMisses);
		logger.info({ durationMs: duration, durationSec: (duration / 1000).toFixed(2) }, 'Symbol generation complete');

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
				(f) =>
					!f.includes('node_modules') &&
					!f.includes('/dist/') &&
					!f.includes('/.turbo/')
			);
			allFiles.push(...filtered);
		}

		return allFiles;
	}

	/**
	 * Extract symbols from a TypeScript file
	 */
	private async extractSymbolsFromFile(filePath: string, relativeFile: string): Promise<SymbolDefinition[]> {
		try {
			const sourceCode = await retryWithBackoff(
				() => fsp.readFile(filePath, 'utf-8'),
				{ maxRetries: 2 }
			);
			const sourceFile = ts.createSourceFile(
				filePath,
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

		const symbols: SymbolDefinition[] = [];

		const visit = (node: ts.Node) => {
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
					.flatMap((clause) =>
						clause.types.map((t) => t.expression.getText(sourceFile))
					)
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
					.flatMap((clause) =>
						clause.types.map((t) => t.expression.getText(sourceFile))
					)
					.filter((name) => /^[A-Z]/.test(name));

				// Extract implements clause
				const implementsTypes = node.heritageClauses
					?.filter((clause) => clause.token === ts.SyntaxKind.ImplementsKeyword)
					.flatMap((clause) =>
						clause.types.map((t) => t.expression.getText(sourceFile))
					)
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
					implements:
						implementsTypes && implementsTypes.length > 0
							? implementsTypes
							: undefined,
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
									declaration.initializer.getText(sourceFile).length > 100
										? '...'
										: ''
							  }`
							: '';

						const constKeyword =
							node.declarationList.flags & ts.NodeFlags.Const ? 'const' : 'let';

						const constSymbol: SymbolDefinition = {
							name: varName,
							path: relativeFile,
							line:
								sourceFile.getLineAndCharacterOfPosition(declaration.getStart())
									.line + 1,
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
		} catch (error) {
			throw ProcessingError.parse(filePath, error);
		}
	}

	/**
	 * Extract related symbol names from a type node
	 */
	private extractRelatedSymbols(node: ts.Node, sourceFile: ts.SourceFile): string[] {
		const related = new Set<string>();

		const visitType = (typeNode: ts.Node) => {
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
	private extractJSDoc(
		node: ts.Node,
		sourceFile: ts.SourceFile
	): SymbolDefinition['jsDoc'] {
		const jsDocComments = (node as any).jsDoc;
		if (!jsDocComments || jsDocComments.length === 0) return undefined;

		const jsDoc = jsDocComments[0];
		const description = jsDoc.comment || '';

		// Helper to normalize comment text
		const normalizeComment = (comment: any): string => {
			if (!comment) return '';
			if (typeof comment === 'string') return comment;
			if (Array.isArray(comment)) {
				return comment.map((c: any) => c.text || '').join('');
			}
			return String(comment);
		};

		// Collect all @example tags
		const exampleTags =
			jsDoc.tags?.filter((t: any) => t.tagName.text === 'example') || [];
		const examples = exampleTags
			.map((t: any) => normalizeComment(t.comment))
			.filter(Boolean);

		// Collect all @see tags
		const seeTags = jsDoc.tags?.filter((t: any) => t.tagName.text === 'see') || [];
		const seeReferences = seeTags.map((t: any) => normalizeComment(t.comment)).filter(Boolean);

		return {
			description: normalizeComment(description),
			params: jsDoc.tags
				?.filter((t: any) => t.tagName.text === 'param')
				.map((t: any) => ({
					name: t.name?.text || '',
					description: normalizeComment(t.comment),
					type: t.typeExpression?.type?.getText(sourceFile) || 'unknown',
				})),
			returns: normalizeComment(
				jsDoc.tags?.find((t: any) => t.tagName.text === 'returns')?.comment
			),
			example: examples.length > 0 ? examples.join('\n\n') : undefined,
			see: seeReferences.length > 0 ? seeReferences : undefined,
		};
	}

	/**
	 * Load cache from disk
	 */
	private async loadCache(): Promise<SymbolCache> {
		try {
			const cacheData = await fsp.readFile(this.cacheFile, 'utf-8');
			const cache = JSON.parse(cacheData) as SymbolCache;

			// Invalidate cache if version mismatch
			if (cache.version !== this.config.cacheVersion) {
				logger.warn({ expected: this.config.cacheVersion, found: cache.version }, 'Cache version mismatch, invalidating cache');
				return { version: this.config.cacheVersion, files: {} };
			}

			return cache;
		} catch (error: any) {
			// ENOENT means file doesn't exist, which is fine
			if (error?.code === 'ENOENT') {
				logger.debug('No cache file found, starting fresh');
				return { version: this.config.cacheVersion, files: {} };
			}
			logger.warn({ error: error.message }, 'Failed to load cache, starting fresh');
			return { version: this.config.cacheVersion, files: {} };
		}
	}

	/**
	 * Save cache to disk
	 */
	private async saveCache(cache: SymbolCache): Promise<void> {
		try {
			await fsp.mkdir(this.config.cacheDir, { recursive: true });
			await retryWithBackoff(
				() => fsp.writeFile(this.cacheFile, JSON.stringify(cache, null, 2), 'utf-8'),
				{ maxRetries: 2 }
			);
		} catch (error) {
			throw FileIOError.write(this.cacheFile, error);
		}
	}

	/**
	 * Compute hash of file contents
	 */
	private async hashFile(filePath: string): Promise<string> {
		try {
			const content = await fsp.readFile(filePath, 'utf-8');
			return crypto.createHash('md5').update(content).digest('hex');
		} catch (error) {
			throw FileIOError.read(filePath, error);
		}
	}

	/**
	 * Check if a file has changed since it was cached
	 */
	private async hasFileChanged(filePath: string, cachedEntry: CachedFileEntry | undefined): Promise<boolean> {
		if (!cachedEntry) return true;

		try {
			const stats = await fsp.stat(filePath);

			// Quick check: mtime and size
			if (stats.mtimeMs !== cachedEntry.mtime || stats.size !== cachedEntry.size) {
				return true;
			}

			// Slower check: content hash
			const currentHash = await this.hashFile(filePath);
			return currentHash !== cachedEntry.hash;
		} catch (error) {
			throw FileIOError.stat(filePath, error);
		}
	}

	/**
	 * Write symbol map to disk
	 */
	private async writeSymbolMap(symbolMap: SymbolMap): Promise<void> {
		try {
			const outputDir = path.dirname(this.config.outputPath);
			await fsp.mkdir(outputDir, { recursive: true });
			await retryWithBackoff(
				() => fsp.writeFile(
					this.config.outputPath,
					JSON.stringify(symbolMap, null, 2),
					'utf-8'
				),
				{ maxRetries: 2 }
			);
		} catch (error) {
			throw FileIOError.write(this.config.outputPath, error);
		}
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
		const uniqueNames = Object.keys(symbolMap).length;
		const cacheHitRate = ((cacheHits / totalFiles) * 100).toFixed(1);
		const cacheMissRate = ((cacheMisses / totalFiles) * 100).toFixed(1);

		logger.info({
			symbolCount,
			uniqueNames,
			totalFiles,
			cacheHits,
			cacheMisses,
			cacheHitRate: `${cacheHitRate}%`,
			outputPath: this.config.outputPath
		}, 'Generated symbol map');

		// Disambiguation stats
		const ambiguous = Object.entries(symbolMap).filter(([_, defs]) => defs.length > 1);
		if (ambiguous.length > 0) {
			const samples = ambiguous.slice(0, 5).map(([name, defs]) => ({ name, count: defs.length }));
			logger.warn({
				ambiguousCount: ambiguous.length,
				samples
			}, 'Symbols requiring disambiguation');
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

		const regenerate = async () => {
			if (isRegenerating) {
				logger.debug('Regeneration already in progress, queuing');
				return;
			}

			isRegenerating = true;
			const startTime = Date.now();
			const fileList = Array.from(pendingFiles);
			pendingFiles.clear();

			logger.info({ files: fileList }, 'Regenerating symbol map');

			try {
				const symbolMap = await this.generate();
				const duration = Date.now() - startTime;
				const symbolCount = Object.values(symbolMap).flat().length;

				logger.info({
					duration,
					symbolCount,
					filesChanged: fileList.length
				}, 'Symbol map updated');

				if (onChange) {
					onChange({ symbolCount, duration, files: fileList });
				}
			} catch (error) {
				logger.error({ error }, 'Error regenerating symbol map');
				logger.info('Continuing to watch for changes');
			} finally {
				isRegenerating = false;
			}
		};

		const handleFileChange = (filePath: string) => {
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

		logger.info({ directories: watchDirs.map(dir => path.relative(this.config.baseDir, dir)) }, 'Starting TypeScript file watcher');

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
			close: async () => {
				logger.info('Stopping file watcher');
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
		try {
			await fsp.unlink(this.cacheFile);
		} catch {
			// File doesn't exist, that's fine
		}
		const coldStart = Date.now();
		await this.generate();
		const coldTime = Date.now() - coldStart;
		logger.info({ duration: coldTime }, 'Cold run completed');

		// Test 2: Warm run (with cache, no changes)
		logger.info('Running warm benchmark (cache, no changes)');
		const warmStart = Date.now();
		await this.generate();
		const warmTime = Date.now() - warmStart;
		logger.info({ duration: warmTime }, 'Warm run completed');

		// Test 3: Warm run (with cache, 1 file changed)
		logger.info('Running warm benchmark (cache, 1 file changed)');
		const files = await this.findSourceFiles();
		if (files.length > 0) {
			const testFile = path.resolve(this.config.baseDir, files[0]);
			try {
				const now = new Date();
				await fsp.utimes(testFile, now, now);
			} catch {
				// File doesn't exist or can't be modified, skip
			}
		}
		const modifiedStart = Date.now();
		await this.generate();
		const modifiedTime = Date.now() - modifiedStart;
		logger.info({ duration: modifiedTime }, 'Warm run (with change) completed');

		// Calculate improvement
		const improvement = ((1 - warmTime / coldTime) * 100).toFixed(1);
		const targetAchieved = warmTime < 1000;

		// Check cache file size
		let cacheSize = 0;
		try {
			const stats = await fsp.stat(this.cacheFile);
			cacheSize = stats.size;
		} catch {
			// Cache file doesn't exist
		}

		// Log summary
		logger.info({
			coldTime,
			warmTime,
			warmWithChangeTime: modifiedTime,
			improvement: `${improvement}%`,
			targetAchieved,
			cacheSizeKB: (cacheSize / 1024).toFixed(2)
		}, 'Benchmark summary');

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
 * import { createSymbolMapGenerator } from '@goobits/docs-engine/utils';
 *
 * const generator = createSymbolMapGenerator({
 *   sourcePatterns: ['src/**\/*.ts'],
 *   excludePatterns: ['**\/*.test.ts'],
 *   cacheDir: '.dev/tmp',
 *   cacheVersion: '1.0',
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
