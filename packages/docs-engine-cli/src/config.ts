import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Link checker configuration
 *
 * @public
 */
export interface LinkCheckerConfig {
  /** Base directory for resolving links */
  baseDir?: string;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Validate external links */
  checkExternal?: boolean;
  /** External link timeout (ms) */
  timeout?: number;
  /** Maximum concurrent requests */
  concurrency?: number;
  /** Domains to skip validation */
  skipDomains?: string[];
  /** Valid file extensions */
  validExtensions?: string[];
}

/**
 * Default configuration
 *
 * @public
 */
export const defaultConfig: Required<LinkCheckerConfig> = {
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
  const configFiles = [
    '.linkcheckerrc.json',
    '.linkcheckerrc',
    'linkchecker.config.json',
    'linkchecker.config.js',
  ];

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
export function mergeConfig(config: LinkCheckerConfig = {}): Required<LinkCheckerConfig> {
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
