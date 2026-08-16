import packageManifest from '../../../package.json' with { type: 'json' };

/**
 * Get the current version from package.json
 * @returns The version string from package.json
 */
export function getVersion(): string {
  return packageManifest.version;
}
