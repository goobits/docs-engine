import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { defineConfig } from 'vite';

const localServer = {
  host: '0.0.0.0',
  port: 3390,
  strictPort: true,
};

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '$docs-content': path.resolve(import.meta.dirname, '../docs'),
    },
  },
  server: localServer,
  preview: localServer,
  ssr: {
    noExternal: ['@lucide/svelte'],
  },
});
