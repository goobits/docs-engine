import type { PageServerLoad } from './$types';
import { loadDocsPage } from '../_docsData.server.ts';

export const load: PageServerLoad = loadDocsPage;
