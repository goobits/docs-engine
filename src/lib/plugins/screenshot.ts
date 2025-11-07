import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { encodeJsonBase64 } from '../utils/base64.js';
import { getVersion } from '../utils/version.js';

export interface ScreenshotPluginOptions {
  basePath?: string;
  version?: string;
}

/**
 * Remark plugin that transforms screenshot code blocks into HTML divs for hydration
 *
 * Web screenshot (simple):
 * ```screenshot:homepage
 * https://example.com
 * ```
 *
 * Web screenshot (with config):
 * ```screenshot:dashboard
 * url: http://localhost:3000/dashboard
 * viewport: 1280x720
 * selector: .main
 * fullPage: true
 * ```
 *
 * CLI screenshot:
 * ```screenshot:build
 * type: cli
 * command: npm run build
 * theme: dracula
 * ```
 *
 * @param options - Optional configuration (basePath, version)
 * @returns A unified plugin
 * @public
 */
export function screenshotPlugin(options: ScreenshotPluginOptions = {}): (tree: Root) => void {
  const basePath = options.basePath || '/screenshots';
  const version = options.version || getVersion();

  return (tree: Root) => {
    visit(tree, 'code', (node: any) => {
      // Match code blocks with lang="screenshot:name"
      if (!node.lang?.startsWith('screenshot:')) return;

      const name = node.lang.slice('screenshot:'.length);
      if (!name) {
        console.error('Screenshot code block missing name (use: ```screenshot:name)');
        return;
      }

      const content = node.value?.trim() || '';
      let config: Record<string, any> = {};

      // Simple URL-only syntax
      if (content && !content.includes(':')) {
        config.url = content;
      }
      // YAML-like config
      else if (content) {
        // Parse simple key: value pairs
        const lines = content.split('\n');
        for (const line of lines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) continue;

          const key = line.slice(0, colonIndex).trim();
          let value: any = line.slice(colonIndex + 1).trim();

          // Parse boolean values
          if (value === 'true') value = true;
          else if (value === 'false') value = false;

          config[key] = value;
        }
      }

      // Validate based on type
      const type = config.type || 'web';
      if (type === 'cli' && !config.command) {
        console.error(`CLI screenshot "${name}" missing required "command" field`);
        return;
      }
      if (type === 'web' && !config.url) {
        console.error(`Web screenshot "${name}" missing required "url" field`);
        return;
      }

      const screenshotPath = `${basePath}/v${version}/${name}.png`;
      const url = config.url || '';

      // Encode config as base64 for HTML attribute
      const configEncoded = encodeJsonBase64(config);

      // Replace with HTML div for client-side hydration
      node.type = 'html';
      node.value = `<div class="md-screenshot" data-name="${name}" data-url="${url}" data-path="${screenshotPath}" data-version="${version}" data-config="${configEncoded}"></div>`;
    });
  };
}
