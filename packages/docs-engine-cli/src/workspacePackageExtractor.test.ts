import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { extractWorkspacePackageSymbols } from './workspacePackageExtractor.js';

let repoRoot: string | undefined;

function write(relativePath: string, content: string): void {
  if (!repoRoot) throw new Error('Test repository is not initialized.');
  const path = join(repoRoot, relativePath);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

afterEach(() => {
  if (repoRoot) rmSync(repoRoot, { recursive: true, force: true });
  repoRoot = undefined;
});

describe('extractWorkspacePackageSymbols', () => {
  it('follows manifest exports and lets the caller exclude package surfaces', () => {
    repoRoot = mkdtempSync(join(tmpdir(), 'docs-engine-workspace-reference-'));
    write(
      'packages/widget/package.json',
      JSON.stringify({
        exports: {
          '.': './src/index.ts',
          './internal': './src/internal.ts',
        },
      })
    );
    write('packages/widget/src/index.ts', "export { publicThing } from './public.js';\n");
    write(
      'packages/widget/src/public.ts',
      '/** Public API. */\nexport function publicThing(): string { return "ok"; }\n'
    );
    write(
      'packages/widget/src/internal.ts',
      '/** Internal API. */\nexport function internalThing(): string { return "hidden"; }\n'
    );

    const result = extractWorkspacePackageSymbols({
      repoRoot,
      packagePaths: ['packages/widget'],
      includeExport: (key) => key !== './internal',
    });

    expect(result['packages/widget'].symbols.map((symbol) => symbol.name)).toEqual(['publicThing']);
    expect(result['packages/widget'].symbols[0]).toMatchObject({
      doc: 'Public API.',
      file: 'src/public.ts',
      kind: 'Function',
    });
  });

  it('extracts exported symbols from Svelte module scripts', () => {
    repoRoot = mkdtempSync(join(tmpdir(), 'docs-engine-svelte-reference-'));
    write('packages/widget/package.json', JSON.stringify({ exports: './src/Widget.svelte' }));
    write(
      'packages/widget/src/Widget.svelte',
      '<script module lang="ts">\n/** Widget mode. */\nexport const mode = "ready";\n</script>\n'
    );

    const result = extractWorkspacePackageSymbols({
      repoRoot,
      packagePaths: ['packages/widget'],
    });

    expect(result['packages/widget'].symbols).toEqual([
      expect.objectContaining({
        doc: 'Widget mode.',
        file: 'src/Widget.svelte',
        kind: 'Const',
        line: 3,
        name: 'mode',
      }),
    ]);
  });
});
