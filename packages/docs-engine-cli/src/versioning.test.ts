import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVersion, deleteVersion, listVersions } from './versioning.ts';

describe('documentation version paths', () => {
  let docsDir: string;

  beforeEach(async () => {
    docsDir = await mkdtemp(path.join(tmpdir(), 'docs-engine-versioning-'));
  });

  afterEach(async () => {
    await rm(docsDir, { recursive: true, force: true });
  });

  it('creates a direct-child version without recursively copying version storage', async () => {
    await writeFile(path.join(docsDir, 'guide.md'), '# Guide');

    await createVersion('1.2.0-beta.1', docsDir);

    await expect(
      readFile(path.join(docsDir, 'versioned_docs', 'version-1.2.0-beta.1', 'guide.md'), 'utf8')
    ).resolves.toBe('# Guide');
    await expect(listVersions(docsDir)).resolves.toMatchObject([{ version: '1.2.0-beta.1' }]);
  });

  it.each(['../outside', '../../..', '/tmp/outside', 'nested/version', 'version\\name', '.'])(
    'rejects unsafe version %j before touching the filesystem',
    async (version) => {
      await expect(createVersion(version, docsDir)).rejects.toThrow(/Version must start/);
      await expect(deleteVersion(version, docsDir)).rejects.toThrow(/Version must start/);
    }
  );

  it('deletes only a real version directory directly below versioned_docs', async () => {
    await mkdir(path.join(docsDir, 'current'));
    await writeFile(path.join(docsDir, 'current', 'guide.md'), '# Guide');
    await createVersion('2.0.0', docsDir);

    await deleteVersion('2.0.0', docsDir);

    await expect(listVersions(docsDir)).resolves.toEqual([]);
  });

  it('refuses to recursively delete a symbolic-link version target', async () => {
    const outsideDir = await mkdtemp(path.join(tmpdir(), 'docs-engine-outside-'));
    try {
      await mkdir(path.join(docsDir, 'versioned_docs'));
      await symlink(outsideDir, path.join(docsDir, 'versioned_docs', 'version-1.0.0'));
      await writeFile(
        path.join(docsDir, 'versions.json'),
        '{"currentVersion":"1.0.0","versions":[]}'
      );

      await expect(deleteVersion('1.0.0', docsDir)).rejects.toThrow(
        /Refusing unsafe documentation directory/
      );
      await expect(readFile(path.join(docsDir, 'versions.json'), 'utf8')).resolves.toContain(
        '1.0.0'
      );
    } finally {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });
});
