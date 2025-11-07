import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3390,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      dist: resolve(__dirname, '../dist'),
    },
  },
});
