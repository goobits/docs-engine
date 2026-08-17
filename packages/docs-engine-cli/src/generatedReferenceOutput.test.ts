import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { outputReferencePages } from './generatedReferenceOutput.js';

let contentDir: string | undefined;

afterEach(() => {
  if (contentDir) rmSync(contentDir, { recursive: true, force: true });
  contentDir = undefined;
});

describe('outputReferencePages', () => {
  it('writes caller-owned generated pages without project-specific paths', () => {
    contentDir = mkdtempSync(join(tmpdir(), 'docs-engine-generated-reference-'));

    const succeeded = outputReferencePages(
      contentDir,
      {
        pages: [{ relPath: 'api/widgets.md', content: '# Widgets\n', label: 'widgets' }],
        skipped: [],
        coverage: [],
        violations: [],
      },
      {
        check: false,
        commentCoverage: false,
        strictComments: false,
      }
    );

    expect(succeeded).toBe(true);
    expect(existsSync(join(contentDir, 'api/widgets.md'))).toBe(true);
    expect(readFileSync(join(contentDir, 'api/widgets.md'), 'utf8')).toBe('# Widgets\n');
  });
});
