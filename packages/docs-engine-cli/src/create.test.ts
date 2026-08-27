import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('prompts', () => ({ default: vi.fn() }));
vi.mock('ora', () => ({
  default: (): unknown => {
    const spinner = {
      fail: vi.fn(),
      start: vi.fn(() => spinner),
      succeed: vi.fn(),
    };
    return spinner;
  },
}));
vi.mock('chalk', () => {
  const color = Object.assign((value: string) => value, {});
  Object.assign(color, { bold: color, cyan: color, gray: color, green: color, red: color });
  return { default: color };
});

import { generateProject, main, type ProjectConfig } from './create.js';

let testRoot: string | undefined;

afterEach(() => {
  if (testRoot) rmSync(testRoot, { recursive: true, force: true });
  testRoot = undefined;
  vi.restoreAllMocks();
});

function config(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'my-docs',
    packageManager: 'pnpm',
    features: { screenshots: false, mermaid: false, git: false },
    ...overrides,
  };
}

describe('create-docs-engine', () => {
  it('generates a complete adapter-based SvelteKit project', async () => {
    testRoot = mkdtempSync(path.join(tmpdir(), 'create-docs-engine-'));
    const projectPath = path.join(testRoot, 'my-docs');
    await generateProject(
      projectPath,
      config({
        docsEngineSpec: 'file:/packages/docs-engine.tgz',
        docsEngineCliSpec: 'file:/packages/docs-engine-cli.tgz',
      })
    );

    for (const relativePath of [
      'docs/index.md',
      'svelte.config.js',
      'vite.config.ts',
      'src/app.html',
      'src/routes/docs/_docsData.server.ts',
      'src/routes/docs/[...slug]/+page.server.ts',
      'src/routes/docs/search-index.json/+server.ts',
    ]) {
      expect(existsSync(path.join(projectPath, relativePath)), relativePath).toBe(true);
    }

    const packageJson = JSON.parse(readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
    expect(packageJson.dependencies['@goobits/docs-engine']).toBe('file:/packages/docs-engine.tgz');
    expect(packageJson.dependencies).not.toHaveProperty('mermaid');
    expect(packageJson.devDependencies['@goobits/docs-engine-cli']).toBe(
      'file:/packages/docs-engine-cli.tgz'
    );
    expect(
      readFileSync(path.join(projectPath, 'src/routes/docs/_docsData.server.ts'), 'utf8')
    ).toContain('createSvelteKitDocsRouteHandlers');
    expect(existsSync(path.join(projectPath, 'src/lib/DocsPage.svelte'))).toBe(false);
  });

  it('supports a non-interactive no-install scaffold', async () => {
    testRoot = mkdtempSync(path.join(tmpdir(), 'create-docs-engine-main-'));
    await main(['docs-site', '--yes', '--no-install', '--package-manager', 'pnpm'], testRoot);

    expect(existsSync(path.join(testRoot, 'docs-site/package.json'))).toBe(true);
    expect(existsSync(path.join(testRoot, 'docs-site/node_modules'))).toBe(false);
  });

  it('prints command help without creating a project', async () => {
    testRoot = mkdtempSync(path.join(tmpdir(), 'create-docs-engine-help-'));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await main(['--help'], testRoot);

    expect(log.mock.calls.flat().join('\n')).toContain('Usage: create-docs-engine');
    expect(existsSync(path.join(testRoot, 'my-docs'))).toBe(false);
  });
});
