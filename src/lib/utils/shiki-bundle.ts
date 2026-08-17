import { createBundledHighlighter, isSpecialLang, type HighlighterGeneric } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

const loadBash = (): Promise<typeof import('shiki/langs/bash.mjs')> =>
  import('shiki/langs/bash.mjs');
const loadJavaScript = (): Promise<typeof import('shiki/langs/javascript.mjs')> =>
  import('shiki/langs/javascript.mjs');
const loadPython = (): Promise<typeof import('shiki/langs/python.mjs')> =>
  import('shiki/langs/python.mjs');
const loadTypeScript = (): Promise<typeof import('shiki/langs/typescript.mjs')> =>
  import('shiki/langs/typescript.mjs');

const docsLanguages = {
  bash: loadBash,
  c: () => import('shiki/langs/c.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  csharp: () => import('shiki/langs/csharp.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  javascript: loadJavaScript,
  js: loadJavaScript,
  json: () => import('shiki/langs/json.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  py: loadPython,
  python: loadPython,
  ruby: () => import('shiki/langs/ruby.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  scss: () => import('shiki/langs/scss.mjs'),
  sh: loadBash,
  shell: loadBash,
  sql: () => import('shiki/langs/sql.mjs'),
  svelte: () => import('shiki/langs/svelte.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  ts: loadTypeScript,
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: loadTypeScript,
  vue: () => import('shiki/langs/vue.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
} as const;

const docsThemes = {
  dracula: () => import('shiki/themes/dracula.mjs'),
  'github-dark': () => import('shiki/themes/github-dark.mjs'),
  'github-light': () => import('shiki/themes/github-light.mjs'),
  monokai: () => import('shiki/themes/monokai.mjs'),
  nord: () => import('shiki/themes/nord.mjs'),
  'one-dark-pro': () => import('shiki/themes/one-dark-pro.mjs'),
  'solarized-dark': () => import('shiki/themes/solarized-dark.mjs'),
  'solarized-light': () => import('shiki/themes/solarized-light.mjs'),
} as const;

export type DocsLanguage = keyof typeof docsLanguages;
export type DocsTheme = keyof typeof docsThemes;
export type DocsHighlighter = HighlighterGeneric<DocsLanguage, DocsTheme>;

const createHighlighter = createBundledHighlighter({
  langs: docsLanguages,
  themes: docsThemes,
  engine: createJavaScriptRegexEngine,
});

export function isDocsLanguage(language: string): language is DocsLanguage {
  return Object.hasOwn(docsLanguages, language);
}

export async function createDocsHighlighter(
  theme: string,
  languages: readonly DocsLanguage[] = []
): Promise<DocsHighlighter> {
  if (!Object.hasOwn(docsThemes, theme)) {
    throw new Error(`Shiki theme "${theme}" is not available`);
  }

  return createHighlighter({
    themes: [theme as DocsTheme],
    langs: [...languages],
  });
}

export async function loadDocsLanguage(
  highlighter: DocsHighlighter,
  language: string
): Promise<void> {
  if (isSpecialLang(language)) {
    return;
  }
  if (!isDocsLanguage(language)) {
    throw new Error(`Shiki language "${language}" is not available`);
  }

  await highlighter.loadLanguage(language);
}
