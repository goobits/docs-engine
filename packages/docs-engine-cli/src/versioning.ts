/**
 * Documentation Versioning Utilities
 *
 * Manages multiple versions of documentation with version-specific
 * navigation, search, and routing.
 */

import { promises as fs } from 'fs';
import path from 'path';

const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

/**
 * Version metadata
 */
export interface VersionMetadata {
  version: string;
  label?: 'latest' | 'stable' | 'legacy' | 'deprecated';
  releaseDate?: string;
  deprecationDate?: string;
  message?: string;
}

/**
 * Versions configuration file
 */
export interface VersionsConfig {
  currentVersion: string;
  versions: VersionMetadata[];
}

/**
 * Create a new documentation version
 *
 * Copies current docs to versioned_docs/version-X and updates versions.json
 *
 * @public
 */
export async function createVersion(version: string, docsDir: string): Promise<void> {
  const { versionedDocsDir, versionDir } = resolveVersionDirectory(version, docsDir);
  const currentDocsDir = path.join(docsDir, 'current');

  await ensureOwnedDirectory(versionedDocsDir);
  await assertPathDoesNotExist(versionDir);

  // Copy current docs to versioned directory
  const sourceDir = await fs
    .access(currentDocsDir)
    .then(() => currentDocsDir)
    .catch(() => docsDir);
  const excludedRootEntries =
    sourceDir === docsDir ? new Set(['versioned_docs', 'versions.json']) : undefined;
  await copyDirectory(sourceDir, versionDir, excludedRootEntries);

  // Update versions.json
  const versionsFile = path.join(docsDir, 'versions.json');
  let config: VersionsConfig;

  try {
    const content = await fs.readFile(versionsFile, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // Create new versions config
    config = {
      currentVersion: version,
      versions: [],
    };
  }

  // Add new version
  config.versions.unshift({
    version,
    label: 'latest',
    releaseDate: new Date().toISOString(),
  });

  // Update previous latest
  if (config.versions.length > 1) {
    const previousLatest = config.versions[1];
    if (previousLatest.label === 'latest') {
      previousLatest.label = 'stable';
    }
  }

  config.currentVersion = version;

  // Save versions.json
  await fs.writeFile(versionsFile, JSON.stringify(config, null, 2));
}

/**
 * List all documentation versions
 *
 * @public
 */
export async function listVersions(docsDir: string): Promise<VersionMetadata[]> {
  const versionsFile = path.join(docsDir, 'versions.json');

  try {
    const content = await fs.readFile(versionsFile, 'utf-8');
    const config: VersionsConfig = JSON.parse(content);
    return config.versions;
  } catch {
    return [];
  }
}

/**
 * Delete a documentation version
 *
 * @public
 */
export async function deleteVersion(version: string, docsDir: string): Promise<void> {
  const { versionedDocsDir, versionDir } = resolveVersionDirectory(version, docsDir);

  await assertOwnedDirectory(versionedDocsDir);
  await assertOwnedDirectory(versionDir);
  await fs.rm(versionDir, { recursive: true });

  // Update versions.json
  const versionsFile = path.join(docsDir, 'versions.json');
  const content = await fs.readFile(versionsFile, 'utf-8');
  const config: VersionsConfig = JSON.parse(content);

  config.versions = config.versions.filter((v) => v.version !== version);

  // Update current version if deleted
  if (config.currentVersion === version && config.versions.length > 0) {
    config.currentVersion = config.versions[0].version;
  }

  await fs.writeFile(versionsFile, JSON.stringify(config, null, 2));
}

/**
 * Copy directory recursively
 */
async function copyDirectory(
  src: string,
  dest: string,
  excludedEntries: ReadonlySet<string> = new Set()
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (excludedEntries.has(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Refusing to copy symbolic link from documentation source: ${srcPath}`);
    }

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    } else {
      throw new Error(`Refusing to copy unsupported documentation entry: ${srcPath}`);
    }
  }
}

function resolveVersionDirectory(
  version: string,
  docsDir: string
): { versionedDocsDir: string; versionDir: string } {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(
      'Version must start with a letter or number and contain only letters, numbers, dots, underscores, or hyphens'
    );
  }

  const versionedDocsDir = path.resolve(docsDir, 'versioned_docs');
  const versionDir = path.resolve(versionedDocsDir, `version-${version}`);
  if (path.dirname(versionDir) !== versionedDocsDir) {
    throw new Error('Version directory must be directly inside versioned_docs');
  }

  return { versionedDocsDir, versionDir };
}

async function ensureOwnedDirectory(directory: string): Promise<void> {
  try {
    await assertOwnedDirectory(directory);
  } catch (error) {
    if (!isMissingPathError(error)) {
      throw error;
    }
    await fs.mkdir(directory, { recursive: true });
    await assertOwnedDirectory(directory);
  }
}

async function assertOwnedDirectory(directory: string): Promise<void> {
  const stats = await fs.lstat(directory);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error(`Refusing unsafe documentation directory: ${directory}`);
  }
}

async function assertPathDoesNotExist(target: string): Promise<void> {
  try {
    await fs.lstat(target);
  } catch (error) {
    if (isMissingPathError(error)) {
      return;
    }
    throw error;
  }
  throw new Error(`Documentation version already exists: ${target}`);
}

function isMissingPathError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/**
 * Get version configuration
 *
 * @public
 */
export async function getVersionConfig(docsDir: string): Promise<VersionsConfig | null> {
  const versionsFile = path.join(docsDir, 'versions.json');

  try {
    const content = await fs.readFile(versionsFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
