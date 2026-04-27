import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Get the current version from package.json
 * @returns The version string from package.json
 */
export function getVersion(): string {
  const candidatePaths = [
    join(dirname(fileURLToPath(import.meta.url)), '../../../package.json'),
    join(dirname(fileURLToPath(import.meta.url)), '../../package.json')
  ];

  try {
    for (const packageJsonPath of candidatePaths) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.version) {
          return packageJson.version;
        }
      } catch {
        // Try the next likely package.json location.
      }
    }

    return '1.0.0';
  } catch {
    return '1.0.0';
  }
}
