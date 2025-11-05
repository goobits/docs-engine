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
		console.log('🔍 Scanning TypeScript files...');

		// Load cache
		const cache = this.loadCache();
		const newCache: SymbolCache = { version: this.config.cacheVersion, files: {} };

		// Use Object.create(null) to avoid prototype pollution issues
		const symbolMap: SymbolMap = Object.create(null);
		let symbolCount = 0;
		let cacheHits = 0;
		let cacheMisses = 0;

		// Find all TypeScript files matching patterns
		const allFiles = await this.findSourceFiles();
		console.log(`   Found ${allFiles.length} TypeScript files`);

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
				console.log(`   💾 Using cached ${relativeFile}`);

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
			console.log(`   📄 Processing ${relativeFile}`);

			const fileSymbols = this.extractSymbolsFromFile(filePath, relativeFile);

			// Add to symbol map
			for (const symbol of fileSymbols) {
				if (!Object.prototype.hasOwnProperty.call(symbolMap, symbol.name)) {
					symbolMap[symbol.name] = [];
				}
				symbolMap[symbol.name].push(symbol);
				symbolCount++;
				console.log(`      ✓ ${symbol.kind} ${symbol.name}`);
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
	private extractSymbolsFromFile(filePath: string, relativeFile: string): SymbolDefinition[] {
		const sourceCode = fs.readFileSync(filePath, 'utf-8');
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
	private loadCache(): SymbolCache {
		if (!fs.existsSync(this.cacheFile)) {
			return { version: this.config.cacheVersion, files: {} };
		}

		try {
			const cacheData = fs.readFileSync(this.cacheFile, 'utf-8');
			const cache = JSON.parse(cacheData) as SymbolCache;

			// Invalidate cache if version mismatch
			if (cache.version !== this.config.cacheVersion) {
				console.log('   ⚠️  Cache version mismatch, invalidating cache');
				return { version: this.config.cacheVersion, files: {} };
			}

			return cache;
		} catch (error) {
			console.log('   ⚠️  Failed to load cache, starting fresh');
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
		fs.writeFileSync(
			this.config.outputPath,
			JSON.stringify(symbolMap, null, 2),
			'utf-8'
		);
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

		console.log(`\n✅ Generated symbol map: ${symbolCount} symbols`);
		console.log(`   Unique names: ${Object.keys(symbolMap).length}`);
		console.log(`   Output: ${this.config.outputPath}`);

		// Cache statistics
		console.log(`\n📊 Cache statistics:`);
		console.log(
			`   Cache hits:   ${cacheHits} files (${((cacheHits / totalFiles) * 100).toFixed(1)}%)`
		);
		console.log(
			`   Cache misses: ${cacheMisses} files (${((cacheMisses / totalFiles) * 100).toFixed(1)}%)`
		);
		console.log(`   Cache file:   ${this.cacheFile}`);

		// Disambiguation stats
		const ambiguous = Object.entries(symbolMap).filter(([_, defs]) => defs.length > 1);
		if (ambiguous.length > 0) {
			console.log(`\n   ⚠️  ${ambiguous.length} symbols require disambiguation:`);
			ambiguous.slice(0, 5).forEach(([name, defs]) => {
				console.log(`      - ${name} (${defs.length} definitions)`);
			});
			if (ambiguous.length > 5) {
				console.log(`      ... and ${ambiguous.length - 5} more`);
			}
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
				console.log('   ⏳ Regeneration already in progress, queuing...');
				return;
			}

			isRegenerating = true;
			const startTime = Date.now();
			const fileList = Array.from(pendingFiles);
			pendingFiles.clear();

			console.log('\n⚙️  Regenerating symbol map...');
			if (fileList.length <= 3) {
				fileList.forEach((file) => console.log(`   📝 ${file}`));
			} else {
				fileList.slice(0, 3).forEach((file) => console.log(`   📝 ${file}`));
				console.log(`   📝 ... and ${fileList.length - 3} more files`);
			}

			try {
				const symbolMap = await this.generate();
				const duration = Date.now() - startTime;
				const symbolCount = Object.values(symbolMap).flat().length;

				console.log(`✅ Symbol map updated (${(duration / 1000).toFixed(1)}s, ${symbolCount} symbols)`);

				if (onChange) {
					onChange({ symbolCount, duration, files: fileList });
				}
			} catch (error) {
				console.error('❌ Error regenerating symbol map:', error);
				console.log('   Continuing to watch for changes...');
			} finally {
				isRegenerating = false;
			}

			console.log('\n👀 Watching TypeScript files for changes...');
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

			console.log(`📝 File changed: ${relativePath}`);

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

		console.log('🚀 Starting TypeScript file watcher...');
		console.log('\nWatching directories:');
		watchDirs.forEach((dir) => console.log(`   - ${path.relative(this.config.baseDir, dir)}`));

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
				console.log('\n👀 Watching TypeScript files for changes...');
				console.log('   Press Ctrl+C to stop\n');
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
				console.log(`🗑️  File deleted: ${relativePath}`);
				pendingFiles.add(relativePath);

				if (debounceTimer) {
					clearTimeout(debounceTimer);
				}

				debounceTimer = setTimeout(() => {
					regenerate();
				}, debounce);
			})
			.on('error', (error) => {
				console.error(`❌ Watcher error: ${error}`);
			});

		return {
			close: async () => {
				console.log('\n\n👋 Stopping file watcher...');
				await watcher.close();
				console.log('✅ File watcher stopped');
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
		console.log('🔬 Symbol Map Generation Benchmark\n');
		console.log('='.repeat(50));

		// Test 1: Cold run (no cache)
		console.log('\n📊 Cold run (no cache)');
		if (fs.existsSync(this.cacheFile)) {
			fs.unlinkSync(this.cacheFile);
		}
		const coldStart = Date.now();
		await this.generate();
		const coldTime = Date.now() - coldStart;
		console.log(`   ⏱️  Duration: ${coldTime}ms (${(coldTime / 1000).toFixed(2)}s)`);

		// Test 2: Warm run (with cache, no changes)
		console.log('\n📊 Warm run (cache, no changes)');
		const warmStart = Date.now();
		await this.generate();
		const warmTime = Date.now() - warmStart;
		console.log(`   ⏱️  Duration: ${warmTime}ms (${(warmTime / 1000).toFixed(2)}s)`);

		// Test 3: Warm run (with cache, 1 file changed)
		console.log('\n📊 Warm run (cache, 1 file changed)');
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
		console.log(`   ⏱️  Duration: ${modifiedTime}ms (${(modifiedTime / 1000).toFixed(2)}s)`);

		// Summary
		console.log('\n' + '='.repeat(50));
		console.log('📈 Summary:\n');
		console.log(`Cold run:            ${coldTime}ms (${(coldTime / 1000).toFixed(2)}s)`);
		console.log(`Warm run (no change): ${warmTime}ms (${(warmTime / 1000).toFixed(2)}s)`);
		console.log(`Warm run (1 change):  ${modifiedTime}ms (${(modifiedTime / 1000).toFixed(2)}s)`);

		const improvement = ((1 - warmTime / coldTime) * 100).toFixed(1);
		console.log(`\nImprovement:         ${improvement}% faster`);
		console.log(`Target achieved:     ${warmTime < 1000 ? '✅ Yes' : '❌ No'} (target: <1000ms)`);

		// Check cache file size
		let cacheSize = 0;
		if (fs.existsSync(this.cacheFile)) {
			const stats = fs.statSync(this.cacheFile);
			cacheSize = stats.size;
			console.log(`\n💾 Cache file size:   ${(cacheSize / 1024).toFixed(2)} KB`);
		}

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
