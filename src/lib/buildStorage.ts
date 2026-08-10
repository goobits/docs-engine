import { createHash } from 'node:crypto';
import { mkdirSync, realpathSync, symlinkSync } from 'node:fs';
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

/**
 * Prepare external SvelteKit output so Node can resolve dependencies while
 * prerendering server chunks from outside the checkout.
 */
export const prepareSvelteKitBuildDirectory = (
  projectRoot: string,
  dependencyProjectRoots: readonly string[] = [projectRoot]
): string => {
  const outputRoot = resolveSvelteKitBuildDirectory(projectRoot);
  if (dependencyProjectRoots.length < 1 || dependencyProjectRoots.length > 2) {
    throw new Error('SvelteKit build storage supports one or two dependency roots');
  }

  const dependencyParents =
    dependencyProjectRoots.length === 1
      ? [outputRoot]
      : [path.join(outputRoot, 'output'), outputRoot];

  for (const [index, dependencyProjectRoot] of dependencyProjectRoots.entries()) {
    const dependencyRoot = path.join(
      realpathSync.native(path.resolve(dependencyProjectRoot)),
      'node_modules'
    );
    const outputDependencies = path.join(dependencyParents[index], 'node_modules');

    // Both paths derive from roots validated as absolute and disjoint from the project.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    mkdirSync(dependencyParents[index], { recursive: true });
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      symlinkSync(
        dependencyRoot,
        outputDependencies,
        process.platform === 'win32' ? 'junction' : 'dir'
      );
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
    }

    if (realpathSync.native(outputDependencies) !== realpathSync.native(dependencyRoot)) {
      throw new Error(`SvelteKit build dependencies must resolve to ${dependencyRoot}`);
    }
  }

  return outputRoot;
};
