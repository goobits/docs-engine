import { describe, expect, it } from 'vitest';
import { resolveProjectPath } from './project-path.ts';

describe('resolveProjectPath', () => {
  it('resolves a simple project name directly below the current directory', () => {
    expect(resolveProjectPath('/workspace', 'my-docs')).toBe('/workspace/my-docs');
  });

  it.each(['.', '..', '../outside', 'nested/project', '/tmp/project', 'name\\project', ''])(
    'rejects destructive or ambiguous project target %j',
    (value) => {
      expect(() => resolveProjectPath('/workspace', value)).toThrow(
        /direct child directory|directly inside/
      );
    }
  );
});
