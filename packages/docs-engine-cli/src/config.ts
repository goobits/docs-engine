import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { LinkCheckerConfig, ResolvedLinkCheckerConfig } from './_linkModels.js';

/**
 * Default configuration
 *
 * @public
 */
export const defaultConfig: ResolvedLinkCheckerConfig = {
  baseDir: process.cwd(),
  include: ['**/*.md', '**/*.mdx'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  checkExternal: false,
  timeout: 5000,
  concurrency: 10,
  skipDomains: ['localhost', '127.0.0.1', 'example.com'],
  validExtensions: ['.md', '.mdx'],
};

/**
 * Load configuration from file
 *
 * Supports:
 * - `.linkcheckerrc.json`
 * - `.linkcheckerrc`
 * - `linkchecker.config.json`
 *
 * @param cwd - Current working directory
 * @returns Loaded configuration or undefined
 *
 * @example
 * ```typescript
 * const config = loadConfig('/project');
 * if (config) {
 *   console.log('Using config:', config);
 * }
 * ```
 *
 * @public
 */
export function loadConfig(cwd: string = process.cwd()): LinkCheckerConfig | undefined {
  const configFiles = ['.linkcheckerrc.json', '.linkcheckerrc', 'linkchecker.config.json'];

  for (const configFile of configFiles) {
    const configPath = resolve(cwd, configFile);

    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content) as LinkCheckerConfig;
      } catch (error) {
        console.error(`Error loading config from ${configPath}:`, error);
      }
    }
  }

  return undefined;
}

/**
 * Merge configuration with defaults
 *
 * @param config - User configuration
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const config = mergeConfig({ checkExternal: true });
 * // Returns: { ...defaults, checkExternal: true }
 * ```
 *
 * @public
 */
export function mergeConfig(config: LinkCheckerConfig = {}): ResolvedLinkCheckerConfig {
  return {
    ...defaultConfig,
    ...config,
    // Deep merge arrays
    include: config.include || defaultConfig.include,
    exclude: config.exclude || defaultConfig.exclude,
    skipDomains: [...defaultConfig.skipDomains, ...(config.skipDomains || [])],
    validExtensions: [...defaultConfig.validExtensions, ...(config.validExtensions || [])],
  };
}
