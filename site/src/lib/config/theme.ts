import { createThemeConfig } from '@goobits/themes/core';

export const themeConfig = createThemeConfig({
  defaultMode: 'system',
  defaultScheme: 'default',
  schemes: ['default', 'spells'],
  enableSystemDetection: true,
});
