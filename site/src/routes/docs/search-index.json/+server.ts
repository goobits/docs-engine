import type { RequestHandler } from './$types';
import { getDocsSearch } from '../_docsData.server.ts';

export const prerender = true;
export const GET: RequestHandler = getDocsSearch;
