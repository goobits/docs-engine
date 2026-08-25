import { access, readFile, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const packageRoot = process.cwd();
const componentOutput = resolve(packageRoot, 'dist/components');

for (const entry of await readdir(componentOutput)) {
  if (entry.includes('.test.')) await rm(resolve(componentOutput, entry));
}

await rm(resolve(componentOutput, '__fixtures__'), { force: true, recursive: true });

const packageJson = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
if (packageJson.exports['./components/*']) {
  throw new Error('Component implementation files must remain private');
}

for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const [name, range] of Object.entries(packageJson[field] ?? {})) {
    if (range.startsWith('workspace:')) {
      throw new Error(`Published ${field} range must not use workspace protocol: ${name}`);
    }
  }
}

const builtTargets = new Set([packageJson.main, packageJson.types]);
for (const value of Object.values(packageJson.exports)) {
  if (typeof value === 'string') {
    if (!value.includes('*') && value.startsWith('./dist/')) builtTargets.add(value);
    continue;
  }

  for (const target of Object.values(value)) {
    if (!target.includes('*') && target.startsWith('./dist/')) builtTargets.add(target);
  }
}

await Promise.all(
  [...builtTargets].map(async (target) => {
    try {
      await access(resolve(packageRoot, target));
    } catch {
      throw new Error(`Missing published build target: ${target}`);
    }
  })
);

const rootApi = Object.keys(
  await import(pathToFileURL(resolve(packageRoot, packageJson.main)).href)
);
const expectedRootApi = ['createMarkdownDocs', 'defaultConfig'];

if (rootApi.sort().join('\n') !== expectedRootApi.sort().join('\n')) {
  throw new Error(`Unexpected package root API: ${rootApi.join(', ')}`);
}
