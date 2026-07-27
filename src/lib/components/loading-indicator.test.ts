import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoadingIndicatorFixture from './__fixtures__/LoadingIndicatorFixture.svelte';
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
});
