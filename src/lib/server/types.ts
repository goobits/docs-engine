/**
 * Represents a documentation page loaded from a markdown file
 *
 * @public
 */
export interface DocPage {
  markdown: string;
  title: string;
  slug: string;
}

/**
 * Document loader interface for loading markdown files
 *
 * @public
 */
export interface DocsLoader {
  load(slug: string): Promise<DocPage>;
}

/**
 * Markdown renderer interface for converting markdown to HTML
 *
 * @public
 */
export interface MarkdownRenderer {
  render(markdown: string): Promise<string>;
}

/**
 * Screenshot generation request payload
 *
 * @public
 */
export interface ScreenshotRequest {
  name: string;
  url?: string;
  version?: string;
  config?: {
    type?: 'web' | 'cli';
    // Web screenshot config
    viewport?: string;
    waitFor?: string;
    selector?: string;
    fullPage?: boolean;
    // CLI screenshot config
    command?: string;
    theme?: 'dracula' | 'monokai' | 'solarized' | 'nord';
    showPrompt?: boolean;
    promptText?: string;
  };
}

/**
 * Screenshot generation response
 *
 * @public
 */
export interface ScreenshotResponse {
  success: boolean;
  path?: string;
  error?: string;
}
