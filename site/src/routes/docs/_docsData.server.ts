import path from 'path';
import { dev } from '$app/environment';
import { scanDocumentation } from '@goobits/docs-engine/server';
import {
  buildNavigation,
  createSearchIndex,
  type DocFile,
  type DocsSection,
} from '@goobits/docs-engine/utils';

export const searchIndexUrl = '/docs/search-index.json';

const docsRoot = path.resolve(process.cwd(), '..', 'docs');
const scanDocs = (): Promise<DocFile[]> =>
  scanDocumentation({
    docsRoot,
    basePath: '/docs',
    exclude: (filePath) =>
      filePath.includes('README') || filePath.startsWith('_') || filePath.includes('node_modules'),
  });

let navigationPromise: Promise<DocsSection[]> | null = null;
let searchIndexPromise: Promise<string> | null = null;
let docsPromise: Promise<DocFile[]> | null = null;

function getDocs(): Promise<DocFile[]> {
  if (dev) return scanDocs();
  if (!docsPromise) {
    const request = scanDocs();
    docsPromise = request;
    void request.catch(() => {
      if (docsPromise === request) docsPromise = null;
    });
  }
  return docsPromise;
}

export function getDocsNavigation(): Promise<DocsSection[]> {
  const build = async (): Promise<DocsSection[]> => buildNavigation(await getDocs());
  if (dev) return build();
  if (!navigationPromise) {
    const request = build();
    navigationPromise = request;
    void request.catch(() => {
      if (navigationPromise === request) navigationPromise = null;
    });
  }
  return navigationPromise;
}

export function getDocsSearchIndex(): Promise<string> {
  const build = async (): Promise<string> => {
    const files = await getDocs();
    const navigation = buildNavigation(files);
    return createSearchIndex(navigation, new Map(files.map((file) => [file.href, file.content])));
  };
  if (dev) return build();
  if (!searchIndexPromise) {
    const request = build();
    searchIndexPromise = request;
    void request.catch(() => {
      if (searchIndexPromise === request) searchIndexPromise = null;
    });
  }
  return searchIndexPromise;
}
