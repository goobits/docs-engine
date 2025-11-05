export interface MarkdownDocsConfig {
  docsRoot: string;
  routePrefix: string;
  screenshots: {
    enabled: boolean;
    basePath: string;
    version?: string;
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
  };
  features: {
    search: boolean;
    breadcrumbs: boolean;
    editOnGithub: boolean;
  };
  github?: {
    repo: string;
    branch: string;
    docsPath: string;
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

export const defaultConfig: MarkdownDocsConfig = {
  docsRoot: '../docs',
  routePrefix: '/docs',
  screenshots: {
    enabled: true,
    basePath: '/screenshots',
    cli: {
      allowedCommands: [],
      timeout: 10000,
      maxOutputLength: 50000,
    },
  },
  markdown: {
    theme: 'dracula',
    gfm: true,
    breaks: true,
  },
  features: {
    search: true,
    breadcrumbs: true,
    editOnGithub: false,
  },
};

export function createMarkdownDocs(userConfig: Partial<MarkdownDocsConfig> = {}): MarkdownDocsConfig {
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
