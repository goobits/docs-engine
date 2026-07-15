import path from 'node:path';

const PROJECT_DIRECTORY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function resolveProjectPath(cwd: string, value: string): string {
  const projectName = value.trim();
  if (!PROJECT_DIRECTORY_PATTERN.test(projectName) || projectName === '.' || projectName === '..') {
    throw new Error('Project name must be one direct child directory name');
  }

  const root = path.resolve(cwd);
  const projectPath = path.resolve(root, projectName);
  if (path.dirname(projectPath) !== root) {
    throw new Error('Project path must stay directly inside the current directory');
  }
  return projectPath;
}
