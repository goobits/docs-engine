import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import packageManifest from '../../../package.json' with { type: 'json' };
import LoadingIndicatorFixture from './__fixtures__/LoadingIndicatorFixture.svelte';
import Screenshot from './Screenshot.svelte';
import ScreenshotImage from './ScreenshotImage.svelte';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('docs loading indicators', () => {
  it('renders an injected indicator while checking a screenshot', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<never>(() => {}))
    );

    const { getByRole, getByTestId } = render(ScreenshotImage, {
      props: {
        name: 'journal',
        url: 'https://example.com/journal',
        path: '/screenshots/journal.png',
        version: '1.0.0',
        loadingIndicator: LoadingIndicatorFixture,
      },
    });

    expect(getByRole('status').textContent).toContain('Checking cache');
    expect(getByTestId('loading-indicator')).toMatchObject({
      dataset: {
        size: '40px',
        thickness: '3px',
      },
    });
    expect(getByTestId('loading-indicator').getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults screenshot cache paths to the package manifest version', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ width: 1400, height: 800 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { findByText } = render(Screenshot, {
      props: {
        name: 'journal',
        url: 'https://example.com/journal',
      },
    });

    expect(await findByText(`v${packageManifest.version}`)).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith(`/screenshots/v${packageManifest.version}/journal.png`, {
      method: 'HEAD',
    });
  });
});
