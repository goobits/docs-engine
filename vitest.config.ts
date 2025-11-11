import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 3391,
    host: '0.0.0.0',
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        memoryLimit: '512MB',
      },
    },
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.svelte',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
      all: true,
    },
  },
});
