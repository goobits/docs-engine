/**
 * Documentation Versioning Utilities
 *
 * Manages multiple versions of documentation with version-specific
 * navigation, search, and routing.
 */

import { promises as fs } from 'fs';
import path from 'path';

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
  const versionedDocsDir = path.join(docsDir, 'versioned_docs');
  const currentDocsDir = path.join(docsDir, 'current');
  const versionDir = path.join(versionedDocsDir, `version-${version}`);

  // Ensure versioned_docs directory exists
  await fs.mkdir(versionedDocsDir, { recursive: true });

  // Copy current docs to versioned directory
  const sourceDir = await fs
    .access(currentDocsDir)
    .then(() => currentDocsDir)
    .catch(() => docsDir);
  await copyDirectory(sourceDir, versionDir);

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
  const versionedDocsDir = path.join(docsDir, 'versioned_docs');
  const versionDir = path.join(versionedDocsDir, `version-${version}`);

  // Remove version directory
  await fs.rm(versionDir, { recursive: true, force: true });

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
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
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
