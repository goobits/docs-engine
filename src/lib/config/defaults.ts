import { TIMEOUT, FILE_SIZE } from '../constants.ts';

export interface MarkdownDocsConfig {
  docsRoot: string;
  routePrefix: string;
  screenshots: {
    enabled: boolean;
    basePath: string;
    version?: string;
    /** Hostnames that web screenshots may access. Empty fails closed. */
    allowedDomains?: string[];
    /** Filesystem root for generated versions. Defaults to static/{basePath}. */
    outputDir?: string;
    cli?: {
      allowedCommands?: string[];
      timeout?: number;
      maxOutputLength?: number;
    };
  };
  markdown: {
    theme: string;
    gfm: boolean;
    breaks: boolean;
    tableOfContents: boolean;
  };
  features: {
    search: boolean;
    breadcrumbs: boolean;
    editOnGithub: boolean;
  };
  git?: {
    /** Repository URL (e.g., "https://github.com/user/repo") */
    repoUrl: string;
    /** Branch name (default: "main") */
    branch?: string;
    /** Path to docs directory within repo (default: "docs") */
    docsPath?: string;
    /** Text for edit link (default: "Edit this page") */
    editLinkText?: string;
    /** Show last updated timestamp (default: true) */
    showLastUpdated?: boolean;
    /** Show contributors list (default: true) */
    showContributors?: boolean;
  };
  seo?: {
    /** Site URL for canonical links and sitemap (e.g., "https://docs.example.com") */
    siteUrl: string;
    /** Site name for Open Graph tags */
    siteName?: string;
    /** Default Open Graph image */
    defaultOgImage?: string;
    /** Twitter handle (e.g., "@username") */
    twitterHandle?: string;
    /** Generate sitemap.xml (default: true) */
    generateSitemap?: boolean;
    /** Generate robots.txt (default: true) */
    generateRobots?: boolean;
  };
}

export type MarkdownDocsOptions = Partial<
  Omit<MarkdownDocsConfig, 'screenshots' | 'markdown' | 'features'>
> & {
  screenshots?: Partial<Omit<MarkdownDocsConfig['screenshots'], 'cli'>> & {
    cli?: Partial<NonNullable<MarkdownDocsConfig['screenshots']['cli']>>;
  };
  markdown?: Partial<MarkdownDocsConfig['markdown']>;
  features?: Partial<MarkdownDocsConfig['features']>;
};

export const defaultConfig: MarkdownDocsConfig = {
  docsRoot: '../docs',
  routePrefix: '/docs',
  screenshots: {
    enabled: true,
    basePath: '/screenshots',
    allowedDomains: [],
    cli: {
      allowedCommands: [],
      timeout: TIMEOUT.VERY_LONG,
      maxOutputLength: FILE_SIZE.MAX_CLI_OUTPUT,
    },
  },
  markdown: {
    theme: 'dracula',
    gfm: true,
    breaks: false,
    tableOfContents: true,
  },
  features: {
    search: true,
    breadcrumbs: true,
    editOnGithub: false,
  },
};

export function createMarkdownDocs(userConfig: MarkdownDocsOptions = {}): MarkdownDocsConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    screenshots: {
      ...defaultConfig.screenshots,
      ...userConfig.screenshots,
      cli: {
        ...defaultConfig.screenshots.cli,
        ...userConfig.screenshots?.cli,
      },
    },
    markdown: { ...defaultConfig.markdown, ...userConfig.markdown },
    features: { ...defaultConfig.features, ...userConfig.features },
  };
}
