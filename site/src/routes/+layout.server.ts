import type { LayoutServerLoad } from './$types';

// Theme is handled by DocsLayout's ThemeToggle component via localStorage
export const load: LayoutServerLoad = () => {
  return {};
};
