import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGitCache, getContributors, getLastUpdated, isGitRepository } from './git.ts';

const execFile = vi.hoisted(() => vi.fn());

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    default: { ...actual, execFileSync: execFile },
    execFileSync: execFile,
  };
});

describe('Git command safety', () => {
  beforeEach(() => {
    clearGitCache();
    execFile.mockReset();
  });

  it('passes file paths as data after the Git option separator', async () => {
    const filePath = 'docs/page"; touch injected; #.md';
    execFile.mockReturnValue('2026-07-14 12:00:00 -0700');

    const updated = await getLastUpdated(filePath);

    expect(updated).toEqual(new Date('2026-07-14 12:00:00 -0700'));
    expect(execFile).toHaveBeenCalledWith(
      'git',
      ['log', '-1', '--format=%ai', '--', filePath],
      expect.objectContaining({ encoding: 'utf-8' })
    );
  });

  it('keeps contributor paths out of the command shell', async () => {
    const filePath = '--author=$(touch injected)';
    execFile.mockReturnValue('Ada|ada@example.com\nAda|ada@example.com');

    await expect(getContributors(filePath)).resolves.toEqual([
      expect.objectContaining({ email: 'ada@example.com', commits: 2 }),
    ]);
    expect(execFile).toHaveBeenCalledWith(
      'git',
      ['log', '--format=%an|%ae', '--', filePath],
      expect.objectContaining({ encoding: 'utf-8' })
    );
  });

  it('checks repository state without a command shell', () => {
    execFile.mockReturnValue('.git');

    expect(isGitRepository()).toBe(true);
    expect(execFile).toHaveBeenCalledWith(
      'git',
      ['rev-parse', '--git-dir'],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] })
    );
  });
});
