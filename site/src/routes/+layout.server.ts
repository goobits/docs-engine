import { loadThemePreferences } from '@goobits/themes/server';
import { themeConfig } from '$lib/config/theme';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
  return {
    preferences: loadThemePreferences(cookies, themeConfig),
  };
};
