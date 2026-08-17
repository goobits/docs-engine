import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = join(process.cwd(), 'dist/components');

for (const entry of readdirSync(outputDir)) {
  if (entry.includes('.test.')) rmSync(join(outputDir, entry));
}

rmSync(join(outputDir, '__fixtures__'), { force: true, recursive: true });
