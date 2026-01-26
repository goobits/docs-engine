import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/create.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['@goobits/docs-engine'],
});
