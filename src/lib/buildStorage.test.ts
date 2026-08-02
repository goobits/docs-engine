import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolveSvelteKitBuildDirectory,
  resolveTestArtifactDirectory,
  resolveViteCacheDirectory,
} from './buildStorage.ts';

describe('build storage', () => {
  let temporaryRoot: string;
  let projectRoot: string;

  beforeEach(() => {
    temporaryRoot = mkdtempSync(path.join(tmpdir(), 'docs-engine-build-storage-'));
    projectRoot = path.join(temporaryRoot, 'project');
    mkdirSync(projectRoot);
    vi.stubEnv('GOOBITS_CACHE_ROOT', '');
    vi.stubEnv('GOOBITS_BUILD_ROOT', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(temporaryRoot, { recursive: true, force: true });
  });

  it('keeps generated outputs under an external configured build root', () => {
    const buildRoot = path.join(temporaryRoot, 'generated');
    vi.stubEnv('GOOBITS_BUILD_ROOT', buildRoot);

    expect(resolveViteCacheDirectory(projectRoot)).toBe(
      path.join(buildRoot, 'tests', 'cache', 'vite')
    );
    expect(resolveTestArtifactDirectory(projectRoot, 'browser')).toBe(
      path.join(buildRoot, 'tests', 'artifacts', 'browser')
    );
    expect(resolveSvelteKitBuildDirectory(projectRoot)).toBe(path.join(buildRoot, 'svelte-kit'));
  });

  it('rejects relative and workspace-overlapping roots', () => {
    vi.stubEnv('GOOBITS_BUILD_ROOT', 'generated');
    expect(() => resolveViteCacheDirectory(projectRoot)).toThrow('must be absolute');

    vi.stubEnv('GOOBITS_BUILD_ROOT', path.join(projectRoot, '.build'));
    expect(() => resolveViteCacheDirectory(projectRoot)).toThrow(
      'outside and disjoint from the project'
    );
  });

  it('rejects unsafe artifact names', () => {
    vi.stubEnv('GOOBITS_BUILD_ROOT', path.join(temporaryRoot, 'generated'));

    expect(() => resolveTestArtifactDirectory(projectRoot, '../escape')).toThrow(
      'Test storage name must match'
    );
  });
});
