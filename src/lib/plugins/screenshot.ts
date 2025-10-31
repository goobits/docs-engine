import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { parse } from 'yaml';
import type { MarkdownDocsConfig } from '../config/index.js';

export interface ScreenshotConfig {
  type?: 'web' | 'cli';
  // Web screenshot config
  url?: string;
  viewport?: string;
  waitFor?: string;
  selector?: string;
  fullPage?: boolean;
  // CLI screenshot config
  command?: string;
  theme?: 'dracula' | 'monokai' | 'solarized' | 'nord';
  showPrompt?: boolean;
  promptText?: string;
}

/**
 * MDsveX plugin that transforms screenshot code blocks into ScreenshotImage components
 *
 * Usage in markdown (web screenshot):
 * ```screenshot:dashboard
 * url: https://example.com
 * viewport: 1280x720
 * waitFor: .content
 * fullPage: true
 * ```
 *
 * Usage in markdown (CLI screenshot):
 * ```screenshot:cli-output
 * type: cli
 * command: spacebase ping
 * viewport: 800x400
 * theme: dracula
 * ```
 *
 * @param config - Configuration options for screenshot handling
 * @returns A unified plugin
 */
export function screenshotPlugin(config: MarkdownDocsConfig): Plugin {
  const { screenshots } = config;

  return (tree: Root) => {
    if (!screenshots.enabled) return;

    visit(tree, 'code', (node: any) => {
      if (!node.lang?.startsWith('screenshot:')) return;

      const name = node.lang.split(':')[1];
      let screenshotConfig: ScreenshotConfig;

      try {
        screenshotConfig = parse(node.value) as ScreenshotConfig;
      } catch (err) {
        console.error(`Failed to parse screenshot config for ${name}:`, err);
        return;
      }

      // Validate based on type
      const type = screenshotConfig.type || 'web';
      if (type === 'cli') {
        if (!screenshotConfig.command) {
          console.error(`CLI screenshot ${name} is missing required 'command' field`);
          return;
        }
      } else {
        if (!screenshotConfig.url) {
          console.error(`Web screenshot ${name} is missing required 'url' field`);
          return;
        }
      }

      const version = screenshots.version || '1.0.0';
      const screenshotPath = `${screenshots.basePath}/v${version}/${name}.png`;
      const url = screenshotConfig.url || '';

      // Replace with component
      node.type = 'html';
      node.value = `<ScreenshotImage
  name="${name}"
  url="${url}"
  path="${screenshotPath}"
  version="${version}"
  config={${JSON.stringify(screenshotConfig)}}
/>`;
    });
  };
}
