/**
 * API documentation generator CLI
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { parseApi, generateApiDocFile, generateIndexFile } from '@goobits/docs-engine/server';
import type { MarkdownGeneratorConfig } from '@goobits/docs-engine/server';

/**
 * Configuration for API documentation generation
 */
export interface ApiGeneratorConfig {
  entryPoints: string[];
  outputDir: string;
  tsConfigPath?: string;
  exclude?: string[];
  markdownConfig?: MarkdownGeneratorConfig;
  generateIndex?: boolean;
}

/**
 * Generate API documentation from TypeScript files
 */
export async function generateApiDocs(config: ApiGeneratorConfig): Promise<void> {
  // Parse TypeScript files
  const parsedFiles = parseApi({
    entryPoints: config.entryPoints,
    tsConfigPath: config.tsConfigPath,
    exclude: config.exclude,
  });

  if (parsedFiles.length === 0) {
    throw new Error('No API items found in the specified entry points');
  }

  // Ensure output directory exists
  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
  }

  const generatedFiles: Array<{ fileName: string; items: unknown[] }> = [];

  // Generate markdown for each file
  for (const parsedFile of parsedFiles) {
    const { content, fileName } = generateApiDocFile(parsedFile, config.markdownConfig);

    const outputPath = path.join(config.outputDir, fileName);
    writeFileSync(outputPath, content, 'utf-8');

    generatedFiles.push({
      fileName,
      items: parsedFile.items,
    });
  }

  // Generate index file
  if (config.generateIndex !== false) {
    const indexContent = generateIndexFile(generatedFiles);
    const indexPath = path.join(config.outputDir, 'index.md');
    writeFileSync(indexPath, indexContent, 'utf-8');
  }
}
