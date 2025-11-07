import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Get the current version from package.json
 * @returns The version string from package.json
 */
export function getVersion(): string {
  try {
    // Get the path to package.json relative to this file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../../../package.json');

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version || '1.0.0';
  } catch {
    console.warn('Failed to read version from package.json, using default: 1.0.0');
    return '1.0.0';
  }
}
