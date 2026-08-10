import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolveViteCacheDirectory } from '@goobits/docs-engine/build-storage';

export default defineConfig({
  cacheDir: resolveViteCacheDirectory(import.meta.dirname),
  plugins: [sveltekit()],
  server: {
    port: 3390,
    host: '0.0.0.0',
  },
  optimizeDeps: {
    exclude: ['@goobits/themes'],
  },
  ssr: {
    noExternal: ['@goobits/themes', '@lucide/svelte'],
  },
});
