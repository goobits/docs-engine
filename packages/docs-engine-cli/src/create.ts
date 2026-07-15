/**
 * create-docs-engine CLI
 *
 * Scaffolds a new docs-engine documentation site with best practices configured.
 *
 * Usage:
 *   npx create-docs-engine my-docs
 *   cd my-docs
 *   pnpm dev
 */

import { promises as fs } from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { execFileSync } from 'child_process';
import { resolveProjectPath } from './project-path.ts';

interface ProjectConfig {
  projectName: string;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  features: {
    screenshots: boolean;
    mermaid: boolean;
    git: boolean;
  };
  gitRepo?: string;
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 Create Docs Engine\n'));

  // Get project name from args or prompt
  const args = process.argv.slice(2);
  let projectName = args[0];

  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-docs',
    });
    projectName = response.projectName;
  }

  if (!projectName) {
    console.error(chalk.red('❌ Project name is required'));
    process.exit(1);
  }

  // Check if directory exists
  let projectPath: string;
  try {
    projectPath = resolveProjectPath(process.cwd(), projectName);
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
  const dirExists = await fs
    .access(projectPath)
    .then(() => true)
    .catch(() => false);

  if (dirExists) {
    const metadata = await fs.lstat(projectPath);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      console.error(chalk.red(`Refusing to replace a non-directory project path: ${projectPath}`));
      process.exit(1);
    }
    const response = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Directory "${projectName}" already exists. Overwrite?`,
      initial: false,
    });

    if (!response.overwrite) {
      console.log(chalk.yellow('Aborted'));
      process.exit(0);
    }

    await fs.rm(projectPath, { recursive: true });
  }

  // Prompt for configuration
  const answers = await prompts([
    {
      type: 'select',
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
        { title: 'Screenshots (web + CLI)', value: 'screenshots', selected: true },
        { title: 'Mermaid diagrams', value: 'mermaid', selected: true },
        { title: 'Git integration', value: 'git', selected: true },
      ],
    },
    {
      type: (_prev: unknown, values: { features: string[] }): prompts.PromptType | null =>
        values.features.includes('git') ? 'text' : null,
      name: 'gitRepo',
      message: 'Git repository URL (optional):',
      initial: '',
    },
  ]);

  const config: ProjectConfig = {
    projectName,
    packageManager: answers.packageManager,
    features: {
      screenshots: answers.features.includes('screenshots'),
      mermaid: answers.features.includes('mermaid'),
      git: answers.features.includes('git'),
    },
    gitRepo: answers.gitRepo,
  };

  // Generate project
  const spinner = ora('Creating project...').start();

  try {
    await generateProject(projectPath, config);
    spinner.succeed('Project created successfully!');

    // Install dependencies
    spinner.text = 'Installing dependencies...';
    spinner.start();
    await installDependencies(projectPath, config.packageManager);
    spinner.succeed('Dependencies installed!');

    // Success message
    console.log(chalk.green.bold('\n✨ All done!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray(`  cd ${projectName}`));
    console.log(chalk.gray(`  ${config.packageManager} dev`));
    console.log();
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}

/**
 * Generate project files
 */
async function generateProject(projectPath: string, config: ProjectConfig): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });

  // Create package.json
  const packageJson = {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite dev',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      '@goobits/docs-engine': 'latest',
      '@sveltejs/kit': '^2.0.0',
      svelte: '^5.0.0',
    },
    devDependencies: {
      '@sveltejs/adapter-auto': '^3.0.0',
      '@sveltejs/vite-plugin-svelte': '^4.0.0',
      vite: '^6.0.0',
    },
  };

  await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create basic documentation structure
  await fs.mkdir(path.join(projectPath, 'docs'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'src/routes'), { recursive: true });

  // Create sample docs
  await fs.writeFile(
    path.join(projectPath, 'docs/index.md'),
    `---
title: Home
description: Welcome to the documentation
section: Getting Started
order: 1
---

# Welcome to Docs Engine

This is your new documentation site powered by docs-engine.

## Features

- 📝 Markdown-based documentation
- 🎨 Beautiful theming (Dracula, GitHub, Minimal)
- 🔍 Instant Cmd+K search
- ⬅️➡️ Previous/Next navigation
- 🔧 Git integration with edit links
- 📊 Mermaid diagrams
${config.features.screenshots ? '- 📸 Screenshot support\n' : ''}`
  );

  await fs.writeFile(
    path.join(projectPath, 'docs/getting-started.md'),
    `---
title: Getting Started
description: Learn how to use docs-engine
section: Getting Started
order: 2
---

# Getting Started

Start writing documentation by adding markdown files to the \`docs/\` directory.

## Writing Docs

Each markdown file can have frontmatter:

\`\`\`yaml
---
title: Page Title
description: Page description
section: Section Name
order: 1
---
\`\`\`
`
  );

  // Create README
  await fs.writeFile(
    path.join(projectPath, 'README.md'),
    `# ${config.projectName}

Documentation site built with [docs-engine](https://github.com/goobits/docs-engine).

## Development

\`\`\`bash
${config.packageManager} dev
\`\`\`

## Building

\`\`\`bash
${config.packageManager} build
\`\`\`
`
  );

  // Create .gitignore
  await fs.writeFile(
    path.join(projectPath, '.gitignore'),
    `node_modules/
.svelte-kit/
build/
.DS_Store
*.log
`
  );
}

/**
 * Install dependencies
 */
async function installDependencies(projectPath: string, packageManager: string): Promise<void> {
  const commands: Record<string, { executable: string; args: string[] }> = {
    npm: { executable: 'npm', args: ['install'] },
    pnpm: { executable: 'pnpm', args: ['install'] },
    yarn: { executable: 'yarn', args: [] },
  };
  const command = commands[packageManager];
  if (!command) throw new Error(`Unsupported package manager: ${packageManager}`);

  execFileSync(command.executable, command.args, {
    cwd: projectPath,
    stdio: 'ignore',
  });
}

// Run CLI
main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
