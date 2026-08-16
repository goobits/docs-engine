import { describe, expect, it } from 'vitest';
import packageManifest from '../../../package.json' with { type: 'json' };
import { getVersion } from './version.ts';

describe('getVersion', () => {
  it('uses the package manifest version without runtime filesystem access', () => {
    expect(getVersion()).toBe(packageManifest.version);
  });
});
