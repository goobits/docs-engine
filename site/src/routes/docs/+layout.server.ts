import type { LayoutServerLoad } from './$types';
import { loadDocsLayout } from './_docsData.server.ts';

export const load: LayoutServerLoad = loadDocsLayout;
