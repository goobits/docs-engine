export interface MarkdownDocsConfig {
  docsRoot: string;
  routePrefix: string;
  screenshots: {
    enabled: boolean;
    basePath: string;
    version?: string;
    cli?: {
      allowedCommands: string[];
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
