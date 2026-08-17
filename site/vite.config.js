import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '$docs-content': path.resolve(import.meta.dirname, '../docs'),
    },
  },
  server: {
    port: 3390,
    host: '0.0.0.0',
  },
  ssr: {
    noExternal: ['@lucide/svelte'],
  },
});
