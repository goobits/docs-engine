import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

for (const file of ['dist/index.js', 'dist/create.js']) {
  const output = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const lines = output.split('\n', 3);
  if (lines[0] !== '#!/usr/bin/env node' || lines[1] === '#!/usr/bin/env node') {
    throw new Error(`${file} must contain exactly one leading Node shebang`);
  }
}
