import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ApiRepositoryConfig, ApiSymbolMap } from '@goobits/docs-engine/reference';
import { extractPackageApi } from './apiParser.js';
import { renderApiReference } from './referenceOutput.js';

export interface ApiGeneratorConfig {
  rootDir: string;
  sourcePatterns: string[];
  excludePatterns: string[];
  outputDir: string;
  cacheDir: string;
  cacheVersion: string;
  title?: string;
  repository?: ApiRepositoryConfig;
}

export interface ApiGeneratorResult {
  symbols: ApiSymbolMap;
  symbolCount: number;
  referencePath: string;
  symbolMapPath: string;
}

/** Generate the reusable symbol map and its Markdown reference in one pass. */
export async function generateApiReference(
  config: ApiGeneratorConfig
): Promise<ApiGeneratorResult> {
  const rootDir = resolve(config.rootDir);
  const outputDir = resolve(rootDir, config.outputDir);
  const symbolMapPath = join(outputDir, 'symbol-map.json');
  const referencePath = join(outputDir, 'index.md');

  mkdirSync(outputDir, { recursive: true });
  const symbols = await extractPackageApi({
    sourcePatterns: config.sourcePatterns,
    excludePatterns: config.excludePatterns,
    cacheDir: resolve(rootDir, config.cacheDir),
    cacheVersion: config.cacheVersion,
    outputPath: symbolMapPath,
    baseDir: rootDir,
  });
  writeApiReferenceOutput(config, symbols);

  return {
    symbols,
    symbolCount: Object.values(symbols).flat().length,
    referencePath,
    symbolMapPath,
  };
}

/** Refresh the Markdown page from an already extracted symbol map. */
export function writeApiReferenceOutput(config: ApiGeneratorConfig, symbols: ApiSymbolMap): string {
  const referencePath = resolve(config.rootDir, config.outputDir, 'index.md');
  mkdirSync(resolve(config.rootDir, config.outputDir), { recursive: true });
  writeFileSync(
    referencePath,
    renderApiReference(symbols, {
      title: config.title,
      repository: config.repository,
    }),
    'utf-8'
  );
  return referencePath;
}
