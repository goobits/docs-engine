import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const storageNamePattern = /^[a-z0-9][a-z0-9._-]*$/;

const pathContains = (parent: string, candidate: string): boolean => {
  const relativePath = path.relative(parent, candidate);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const resolveCacheRoot = (projectRoot: string): string => {
  const project = realpathSync.native(path.resolve(projectRoot));
  const configured = process.env.GOOBITS_CACHE_ROOT?.trim();
  if (configured && !path.isAbsolute(configured)) {
    throw new Error(`GOOBITS_CACHE_ROOT must be absolute: ${configured}`);
  }
  const fingerprint = createHash('sha256').update(project).digest('hex').slice(0, 12);
  const cacheRoot = configured
    ? path.resolve(configured)
    : path.join(homedir(), '.cache', 'goobits', 'build-storage', fingerprint);
  if (pathContains(project, cacheRoot) || pathContains(cacheRoot, project)) {
    throw new Error(`Build cache must be outside and disjoint from the project: ${cacheRoot}`);
  }
  return cacheRoot;
};

const resolveBuildRoot = (projectRoot: string): string => {
  const project = realpathSync.native(path.resolve(projectRoot));
  const configured = process.env.GOOBITS_BUILD_ROOT?.trim();
  if (configured && !path.isAbsolute(configured)) {
    throw new Error(`GOOBITS_BUILD_ROOT must be absolute: ${configured}`);
  }
  const buildRoot = configured
    ? path.resolve(configured)
    : path.join(resolveCacheRoot(projectRoot), 'build');
  if (pathContains(project, buildRoot) || pathContains(buildRoot, project)) {
    throw new Error(`Build root must be outside and disjoint from the project: ${buildRoot}`);
  }
  return buildRoot;
};

const resolveBuildStorage = (projectRoot: string, ...segments: string[]): string =>
  path.join(resolveBuildRoot(projectRoot), ...segments);

const resolveTestStorage = (
  projectRoot: string,
  kind: 'artifacts' | 'cache',
  name: string
): string => {
  if (!storageNamePattern.test(name)) {
    throw new Error(`Test storage name must match ${storageNamePattern}: ${name}`);
  }
  return resolveBuildStorage(projectRoot, 'tests', kind, name);
};

export const resolveViteCacheDirectory = (projectRoot: string): string =>
  resolveTestStorage(projectRoot, 'cache', 'vite');

export const resolveTestArtifactDirectory = (projectRoot: string, name: string): string =>
  resolveTestStorage(projectRoot, 'artifacts', name);

export const resolveSvelteKitBuildDirectory = (projectRoot: string): string =>
  resolveBuildStorage(projectRoot, 'svelte-kit');
