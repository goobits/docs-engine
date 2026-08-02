import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import DocsSidebar from './DocsSidebar.svelte';

afterEach(() => {
  cleanup();
  globalThis.localStorage.clear();
});

describe('DocsSidebar', () => {
  it('keeps each section control target in the document while collapsed', async () => {
    const { container, getByRole } = render(DocsSidebar, {
      props: {
        currentPath: '/docs',
        navigation: [
          {
            title: 'Getting Started',
            description: 'Learn the basics',
            links: [
              {
                title: 'Quick start',
                href: '/docs/quick-start',
                description: 'Start here',
              },
            ],
          },
        ],
      },
    });

    const button = getByRole('button', { name: 'Collapse Getting Started section' });
    const targetId = button.getAttribute('aria-controls');
    expect(targetId).toBe('section-getting-started');
    expect(container.querySelector(`#${targetId}`)).not.toBeNull();

    await fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector(`#${targetId}`)).toHaveProperty('hidden', true);
  });
});
