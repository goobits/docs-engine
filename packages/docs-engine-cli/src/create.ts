/** Scaffold a complete SvelteKit documentation site. */

import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { resolveProjectPath } from './project-path.js';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export interface ProjectConfig {
  projectName: string;
  packageManager: PackageManager;
  features: {
    screenshots: boolean;
    mermaid: boolean;
    git: boolean;
  };
  gitRepo?: string;
  docsEngineSpec?: string;
  docsEngineCliSpec?: string;
}

interface CliOptions {
  projectName?: string;
  packageManager?: PackageManager;
  install: boolean;
  defaults: boolean;
  force: boolean;
  docsEngineSpec?: string;
  docsEngineCliSpec?: string;
  help: boolean;
}

const HELP = `Usage: create-docs-engine [project-name] [options]

Options:
  -y, --yes                  Use recommended defaults
  -h, --help                 Show this help
  --package-manager <name>   Use pnpm, npm, or yarn
  --no-install               Create files without installing dependencies
  --force                    Replace an existing project directory
  --docs-engine <spec>       Override the docs-engine package version or path
  --docs-engine-cli <spec>   Override the CLI package version or path`;

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { install: true, defaults: false, force: false, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--yes' || arg === '-y') options.defaults = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--no-install') options.install = false;
    else if (arg === '--force') options.force = true;
    else if (arg === '--package-manager') {
      const value = args[++index];
      if (value !== 'npm' && value !== 'pnpm' && value !== 'yarn') {
        throw new Error('--package-manager must be npm, pnpm, or yarn');
      }
      options.packageManager = value;
    } else if (arg === '--docs-engine') options.docsEngineSpec = requiredValue(args, ++index, arg);
    else if (arg === '--docs-engine-cli')
      options.docsEngineCliSpec = requiredValue(args, ++index, arg);
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (!options.projectName) options.projectName = arg;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  return options;
}

function requiredValue(args: string[], index: number, option: string): string {
  const value = args[index];
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value`);
  return value;
}

async function collectProjectConfig(options: CliOptions): Promise<ProjectConfig> {
  let projectName = options.projectName;
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-docs',
    });
    projectName = response.projectName;
  }
  if (!projectName) throw new Error('Project name is required');

  if (options.defaults) {
    return {
      projectName,
      packageManager: options.packageManager ?? 'pnpm',
      features: { screenshots: true, mermaid: true, git: false },
      docsEngineSpec: options.docsEngineSpec,
      docsEngineCliSpec: options.docsEngineCliSpec,
    };
  }

  const answers = await prompts([
    {
      type: options.packageManager ? null : 'select',
      name: 'packageManager',
      message: 'Package manager:',
      choices: [
        { title: 'pnpm (recommended)', value: 'pnpm' },
        { title: 'npm', value: 'npm' },
        { title: 'yarn', value: 'yarn' },
      ],
      initial: 0,
    },
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select features:',
      choices: [
        { title: 'Screenshots', value: 'screenshots', selected: true },
        { title: 'Mermaid diagrams', value: 'mermaid', selected: true },
        { title: 'Git edit links', value: 'git', selected: true },
      ],
    },
    {
      type: (_previous: unknown, values: { features?: string[] }): prompts.PromptType | null =>
        values.features?.includes('git') ? 'text' : null,
      name: 'gitRepo',
      message: 'Git repository URL (optional):',
      initial: '',
    },
  ]);
  if (!Array.isArray(answers.features)) throw new Error('Project setup was cancelled');

  return {
    projectName,
    packageManager: options.packageManager ?? answers.packageManager,
    features: {
      screenshots: answers.features.includes('screenshots'),
      mermaid: answers.features.includes('mermaid'),
      git: answers.features.includes('git'),
    },
    gitRepo: answers.gitRepo,
    docsEngineSpec: options.docsEngineSpec,
    docsEngineCliSpec: options.docsEngineCliSpec,
  };
}

async function prepareProjectDirectory(
  cwd: string,
  config: ProjectConfig,
  options: CliOptions
): Promise<string> {
  const projectPath = resolveProjectPath(cwd, config.projectName);
  const exists = await fs
    .lstat(projectPath)
    .then((metadata) => metadata)
    .catch(() => null);
  if (!exists) return projectPath;
  if (!exists.isDirectory() || exists.isSymbolicLink()) {
    throw new Error(`Refusing to replace a non-directory project path: ${projectPath}`);
  }
  if (!options.force) {
    if (options.defaults) throw new Error(`Directory already exists: ${config.projectName}`);
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory "${config.projectName}" already exists. Overwrite?`,
      initial: false,
    });
    if (!response.overwrite) throw new Error('Project creation cancelled');
  }
  await fs.rm(projectPath, { recursive: true });
  return projectPath;
}

export async function generateProject(projectPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = createPackageJson(config);
  const files = createProjectFiles(config);
  files['package.json'] = `${JSON.stringify(packageJson, null, 2)}\n`;

  for (const [relativePath, content] of Object.entries(files)) {
    const destination = path.join(projectPath, relativePath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content);
  }
}

function createPackageJson(config: ProjectConfig): Record<string, unknown> {
  const dependencies: Record<string, string> = {
    '@goobits/docs-engine': config.docsEngineSpec ?? 'latest',
    '@lucide/svelte': '^1.25.0',
    '@sveltejs/kit': '^2.70.0',
    svelte: '^5.56.0',
  };
  if (config.features.mermaid) dependencies.mermaid = '^11.15.0';

  return {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite dev',
      build: 'vite build',
      check: 'svelte-kit sync && svelte-check --tsconfig ./jsconfig.json',
      'check-links': 'docs-engine check-links --base-dir docs --public-dir static',
      preview: 'vite preview',
    },
    dependencies,
    devDependencies: {
      '@goobits/docs-engine-cli': config.docsEngineCliSpec ?? 'latest',
      '@sveltejs/adapter-auto': '^7.0.0',
      '@sveltejs/vite-plugin-svelte': '^7.2.0',
      'svelte-check': '^4.7.0',
      typescript: '^6.0.0',
      vite: '^8.1.0',
    },
  };
}

function createProjectFiles(config: ProjectConfig): Record<string, string> {
  const gitConfig =
    config.features.git && config.gitRepo
      ? `\n    git: {\n      repoUrl: ${JSON.stringify(config.gitRepo)},\n      branch: 'main',\n      docsPath: 'docs',\n    },`
      : '';
  const editOnGithub = Boolean(config.features.git && config.gitRepo);

  return {
    '.gitignore': `node_modules/\n.svelte-kit/\nbuild/\n.env\n*.log\n`,
    'README.md': `# ${config.projectName}\n\nA SvelteKit documentation site powered by [Docs Engine](https://github.com/goobits/docs-engine).\n\n## Development\n\n\`\`\`bash\n${config.packageManager} dev\n\`\`\`\n\nAdd Markdown pages under \`docs/\`. The route adapter automatically updates navigation and search.\n\n## Checks\n\n\`\`\`bash\n${config.packageManager} check\n${config.packageManager} check-links\n${config.packageManager} build\n\`\`\`\n`,
    'docs/index.md': `---\ntitle: Home\ndescription: Welcome to the documentation\nsection: Getting Started\norder: 1\n---\n\n# Welcome\n\nThis documentation site is powered by Docs Engine.\n\n## Included\n\n- Markdown pages\n- Generated navigation\n- Instant search\n- Responsive layout\n${config.features.mermaid ? '- Mermaid diagrams\n' : ''}${config.features.screenshots ? '- Screenshot directives\n' : ''}`,
    'docs/getting-started.md': `---\ntitle: Getting Started\ndescription: Add your first documentation page\nsection: Getting Started\norder: 2\n---\n\n# Getting Started\n\nAdd Markdown files to the \`docs/\` directory. Frontmatter controls page metadata and navigation order.\n\n\`\`\`yaml\n---\ntitle: Page title\ndescription: Page description\nsection: Guides\norder: 1\n---\n\`\`\`\n`,
    'jsconfig.json': `{\n  "extends": "./.svelte-kit/tsconfig.json"\n}\n`,
    'svelte.config.js': `import adapter from '@sveltejs/adapter-auto';\nimport { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\n\n/** @type {import('@sveltejs/kit').Config} */\nconst config = {\n  preprocess: vitePreprocess(),\n  kit: { adapter: adapter() },\n};\n\nexport default config;\n`,
    'vite.config.ts': `import { sveltekit } from '@sveltejs/kit/vite';\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({ plugins: [sveltekit()] });\n`,
    'src/app.html': `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    %sveltekit.head%\n  </head>\n  <body data-sveltekit-preload-data="hover">\n    <div style="display: contents">%sveltekit.body%</div>\n  </body>\n</html>\n`,
    'src/app.css': `@import '@goobits/docs-engine/styles';\n\n* { box-sizing: border-box; }\nhtml { color-scheme: dark; }\nbody { margin: 0; background: var(--color-background); color: var(--color-text-primary); }\n`,
    'src/routes/+layout.svelte': `<script lang="ts">\n  import '../app.css';\n  import type { Snippet } from 'svelte';\n\n  let { children }: { children: Snippet } = $props();\n</script>\n\n{@render children()}\n`,
    'src/routes/+page.server.ts': `import { redirect } from '@sveltejs/kit';\n\nexport function load(): never {\n  redirect(307, '/docs');\n}\n`,
    'src/lib/DocsPage.svelte': `<script lang="ts">\n  import { page } from '$app/state';\n  import { DocsLayout } from '@goobits/docs-engine/components';\n  import type { SvelteKitDocsLayoutData, SvelteKitDocsPage } from '@goobits/docs-engine/sveltekit';\n\n  let { data }: { data: SvelteKitDocsPage & SvelteKitDocsLayoutData } = $props();\n  const breadcrumbs = [{ label: 'Docs', href: '/docs' }];\n</script>\n\n<svelte:head>\n  <title>{data.title} - Documentation</title>\n  {#if data.description}<meta name="description" content={data.description} />{/if}\n</svelte:head>\n\n<DocsLayout\n  content={data.content}\n  title={data.title}\n  navigation={data.navigation}\n  currentPath={page.url.pathname}\n  {breadcrumbs}\n  footer={{ text: 'Questions or feedback?' }}\n  editLink={data.editLink}\n  searchIndexUrl={data.searchIndexUrl}\n  hydrators={{ mermaid: ${config.features.mermaid}, screenshot: ${config.features.screenshots}, openapi: false }}\n/>\n`,
    'src/routes/docs/_docsData.server.ts': `import { error } from '@sveltejs/kit';\nimport {\n  createDocsLayoutLoad,\n  createDocsPageLoad,\n  createDocsSearchHandler,\n  createSvelteKitDocs,\n  type MarkdownModuleLoader,\n} from '@goobits/docs-engine/sveltekit';\n\nconst modules = import.meta.glob('../../../docs/**/*.md', {\n  import: 'default',\n  query: '?raw',\n}) as Record<string, MarkdownModuleLoader>;\n\nconst docs = createSvelteKitDocs({\n  modules,\n  config: {\n    routePrefix: '/docs',\n    screenshots: { enabled: ${config.features.screenshots} },\n    features: { editOnGithub: ${editOnGithub} },${gitConfig}\n  },\n});\n\nexport const loadDocsLayout = createDocsLayoutLoad(docs);\nexport const loadDocsPage = createDocsPageLoad(docs, error);\nexport const getDocsSearch = createDocsSearchHandler(docs);\n`,
    'src/routes/docs/+layout.server.ts': `import type { LayoutServerLoad } from './$types';\nimport { loadDocsLayout } from './_docsData.server';\n\nexport const load: LayoutServerLoad = loadDocsLayout;\n`,
    'src/routes/docs/+layout.svelte': `<script lang="ts">\n  import type { Snippet } from 'svelte';\n  let { children }: { children: Snippet } = $props();\n</script>\n\n{@render children()}\n`,
    'src/routes/docs/+page.server.ts': `import type { PageServerLoad } from './$types';\nimport { loadDocsPage } from './_docsData.server';\n\nexport const load: PageServerLoad = loadDocsPage;\n`,
    'src/routes/docs/+page.svelte': `<script lang="ts">\n  import DocsPage from '$lib/DocsPage.svelte';\n  import type { PageData } from './$types';\n  let { data }: { data: PageData } = $props();\n</script>\n\n<DocsPage {data} />\n`,
    'src/routes/docs/[...slug]/+page.server.ts': `import type { PageServerLoad } from './$types';\nimport { loadDocsPage } from '../_docsData.server';\n\nexport const load: PageServerLoad = loadDocsPage;\n`,
    'src/routes/docs/[...slug]/+page.svelte': `<script lang="ts">\n  import DocsPage from '$lib/DocsPage.svelte';\n  import type { PageData } from './$types';\n  let { data }: { data: PageData } = $props();\n</script>\n\n<DocsPage {data} />\n`,
    'src/routes/docs/search-index.json/+server.ts': `import type { RequestHandler } from './$types';\nimport { getDocsSearch } from '../_docsData.server';\n\nexport const prerender = true;\nexport const GET: RequestHandler = getDocsSearch;\n`,
  };
}

export function installDependencies(projectPath: string, packageManager: PackageManager): void {
  const commands: Record<PackageManager, { executable: string; args: string[] }> = {
    npm: { executable: 'npm', args: ['install'] },
    pnpm: { executable: 'pnpm', args: ['install'] },
    yarn: { executable: 'yarn', args: [] },
  };
  const command = commands[packageManager];
  execFileSync(command.executable, command.args, { cwd: projectPath, stdio: 'inherit' });
}

export async function main(args = process.argv.slice(2), cwd = process.cwd()): Promise<void> {
  console.log(chalk.bold.cyan('\nCreate Docs Engine\n'));
  const options = parseArgs(args);
  if (options.help) {
    console.log(HELP);
    return;
  }
  const config = await collectProjectConfig(options);
  const projectPath = await prepareProjectDirectory(cwd, config, options);
  const spinner = ora('Creating project...').start();
  try {
    await generateProject(projectPath, config);
    spinner.succeed('Project created successfully');
    if (options.install) {
      spinner.start('Installing dependencies...');
      installDependencies(projectPath, config.packageManager);
      spinner.succeed('Dependencies installed');
    }
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
  console.log(chalk.green.bold('\nAll done\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log(chalk.gray(`  cd ${config.projectName}`));
  if (!options.install) console.log(chalk.gray(`  ${config.packageManager} install`));
  console.log(chalk.gray(`  ${config.packageManager} dev`));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  });
}
