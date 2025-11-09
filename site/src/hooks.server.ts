import type { Handle } from '@sveltejs/kit';

// Theme is handled by DocsLayout's ThemeToggle component via localStorage
export const handle: Handle = async ({ event, resolve }) => {
  return await resolve(event);
};
