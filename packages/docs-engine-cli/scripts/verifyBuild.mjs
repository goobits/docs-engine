import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8')
);

for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
  for (const [name, range] of Object.entries(packageJson[field] ?? {})) {
    if (range.startsWith('workspace:')) {
      throw new Error(`Published ${field} range must not use workspace protocol: ${name}`);
    }
  }
}

for (const file of ['dist/index.js', 'dist/create.js']) {
  const output = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const lines = output.split('\n', 3);
  if (lines[0] !== '#!/usr/bin/env node' || lines[1] === '#!/usr/bin/env node') {
    throw new Error(`${file} must contain exactly one leading Node shebang`);
  }
}
