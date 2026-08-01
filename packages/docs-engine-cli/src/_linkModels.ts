/** User-provided link checker configuration. */
export interface LinkCheckerConfig {
  baseDir?: string;
  publicDir?: string;
  routePrefix?: string;
  include?: string[];
  exclude?: string[];
  checkExternal?: boolean;
  timeout?: number;
  concurrency?: number;
  skipDomains?: string[];
  validExtensions?: string[];
}

/** Fully resolved link checker configuration used at runtime. */
export type ResolvedLinkCheckerConfig = Required<
  Omit<LinkCheckerConfig, 'publicDir' | 'routePrefix'>
> &
  Pick<LinkCheckerConfig, 'publicDir' | 'routePrefix'>;

/** Link extracted from one documentation source file. */
export interface ExtractedLink {
  url: string;
  text: string;
  file: string;
  line: number;
  type: 'link' | 'image' | 'html';
  isExternal: boolean;
  isAnchor: boolean;
}

/** Result of validating one extracted link. */
export interface ValidationResult {
  link: ExtractedLink;
  isValid: boolean;
  error?: string;
  statusCode?: number;
  redirectUrl?: string;
}
