import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import security from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        require: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security: security,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...security.configs.recommended.rules,

      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code quality
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        queueMicrotask: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        fetch: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        // Browser types
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLDetailsElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLInputElement: 'readonly',
        IntersectionObserver: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        WheelEvent: 'readonly',
        Event: 'readonly',
        // Node globals
        Buffer: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      svelte: sveltePlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      'svelte/no-at-html-tags': 'warn', // Warn on @html - Security Agent will fix
    },
  },
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    // Browser environment for site files
    files: [
      'site/**/*.js',
      'packages/create-docs-engine/site/**/*.js',
      'packages/create-docs-engine/workspace/**/*.js',
    ],
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
      },
    },
  },
  {
    // Build tools and CLI: Allow fs operations (these are intentional and safe)
    files: [
      'packages/docs-engine-cli/**/*.ts',
      'packages/create-docs-engine/src/**/*.ts',
      'src/lib/server/**/*.ts',
      'src/lib/utils/file-io.ts',
      'src/lib/utils/symbol-generation.ts',
      'src/lib/utils/navigation-scanner.ts',
      'src/lib/utils/symbol-resolver.ts',
      'site/src/routes/**/*.ts',
      'tsup.config.ts',
      '**/*.test.ts', // Test files often use fs for fixtures
    ],
    rules: {
      // These are build/CLI tools that need to read/write files
      // All file paths come from user configuration or validated sources
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'build/',
      'node_modules/',
      'coverage/',
      '**/.svelte-kit/**',
      'site/.svelte-kit/**',
      'packages/**/site/**',
      'packages/**/workspace/**',
    ],
  },
];
