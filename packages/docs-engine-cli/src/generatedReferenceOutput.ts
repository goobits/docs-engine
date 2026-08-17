import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  printCoverageReport,
  type ReferenceBuildResult,
  type SkippedTarget,
} from './referenceRendering.js';

function readIfExists(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function walkMarkdown(contentDir: string, directory: string, relPaths: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(contentDir, fullPath, relPaths);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md') && statSync(fullPath).isFile())
      relPaths.push(fullPath.slice(contentDir.length + 1).replaceAll('\\', '/'));
  }
}

function existingGeneratedPagePaths(
  contentDir: string,
  managedDirectories: string[],
  managedFiles: string[]
): string[] {
  const relPaths: string[] = [];
  for (const directory of managedDirectories) {
    const managedDirectory = join(contentDir, directory);
    if (existsSync(managedDirectory)) walkMarkdown(contentDir, managedDirectory, relPaths);
  }
  for (const relPath of managedFiles) {
    if (existsSync(join(contentDir, relPath))) relPaths.push(relPath);
  }
  return relPaths.sort();
}

function printSkipped(skipped: SkippedTarget[]): void {
  if (!skipped.length) return;
  console.log(`\nSkipped ${skipped.length} target(s) (continued):`);
  for (const item of skipped) console.log(`  - ${item.label}: ${item.reason}`);
}

/** Write or validate a generated reference page set. */
export function outputReferencePages(
  contentDir: string,
  result: ReferenceBuildResult,
  options: {
    check: boolean;
    commentCoverage: boolean;
    strictComments: boolean;
    managedDirectories?: string[];
    managedFiles?: string[];
  }
): boolean {
  if (result.violations.length) {
    console.error('Docs reference validation failed:');
    for (const violation of result.violations.sort()) console.error(`  - ${violation}`);
    return false;
  }

  if (options.check) {
    const existing = new Set(
      existingGeneratedPagePaths(
        contentDir,
        options.managedDirectories ?? ['reference'],
        options.managedFiles ?? []
      )
    );
    const stale = result.pages
      .filter((page) => {
        const relPath = page.relPath.replaceAll('\\', '/');
        return (
          existing.has(relPath) && readIfExists(join(contentDir, page.relPath)) !== page.content
        );
      })
      .map((page) => page.label);
    const expected = new Set(result.pages.map((page) => page.relPath.replaceAll('\\', '/')));
    const orphaned = [...existing].filter((relPath) => !expected.has(relPath));
    console.log(`Checked ${result.pages.length} generated page(s).`);
    printSkipped(result.skipped);
    if (stale.length) {
      console.error('\nStale generated page(s) (run "pnpm docs:reference" to refresh):');
      for (const label of stale) console.error(`  - ${label}`);
    }
    if (orphaned.length) {
      console.error('\nOrphaned generated page(s) (remove or restore their source package):');
      for (const relPath of orphaned) console.error(`  - ${relPath}`);
    }
    if (stale.length || orphaned.length) return false;
    const totals =
      options.commentCoverage || options.strictComments
        ? printCoverageReport(result.coverage, options.commentCoverage || options.strictComments)
        : null;
    if (options.strictComments && totals && totals.missing > 0) {
      console.error(`\nMissing source comments for ${totals.missing} generated symbol(s).`);
      return false;
    }
    console.log(
      existing.size === 0
        ? 'Generated pages are not committed; no local generated files were present to compare.'
        : 'Local generated pages are fresh.'
    );
    return true;
  }

  let written = 0;
  for (const page of result.pages) {
    const outPath = join(contentDir, page.relPath);
    if (readIfExists(outPath) === page.content) continue;
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, page.content);
    console.log(`✓ ${page.label}`);
    written++;
  }
  printSkipped(result.skipped);
  if (options.commentCoverage || options.strictComments) {
    const totals = printCoverageReport(
      result.coverage,
      options.commentCoverage || options.strictComments
    );
    if (options.strictComments && totals.missing > 0) {
      console.error(`\nMissing source comments for ${totals.missing} generated symbol(s).`);
      return false;
    }
  }
  console.log(`\nGenerated ${written} changed reference page(s).`);
  return true;
}
