export type PackageDocsMetadata = {
  order?: number;
  referenceTitle?: string;
  slug?: string;
};

export type RelatedPackageLink = {
  label: string;
  href: string;
};

export const referenceBanner =
  '> Generated from source, do not edit by hand. Run `pnpm docs:reference` to refresh.';

export type ReferencePackage = {
  slug: string;
  path: string;
  packageName?: string;
  title: string;
  order: number;
  description?: string;
  relatedPackages?: RelatedPackageLink[];
  docs?: PackageDocsMetadata;
};

export type ReferenceSymbol = {
  kind: string;
  name: string;
  location: string;
  signature?: string;
  doc?: string;
  file?: string;
  startLine?: number;
  [key: string]: unknown;
};

export type CoverageItem = {
  label: string;
  total: number;
  documented: number;
  missing: ReferenceSymbol[];
};

export type RenderedPage = {
  relPath: string;
  content: string;
  label: string;
};

export type SkippedTarget = {
  label: string;
  reason: string;
};

export type ReferenceBuildResult = {
  pages: RenderedPage[];
  skipped: SkippedTarget[];
  coverage: CoverageItem[];
  violations: string[];
};

export type PackageReferenceResult = Pick<
  ReferenceBuildResult,
  'pages' | 'skipped' | 'coverage'
> & { generatedSlugs: Set<string> };

export function createPackageReferenceResult(): PackageReferenceResult {
  return { pages: [], skipped: [], coverage: [], generatedSlugs: new Set() };
}

type ReferencePageConfig = {
  intro?: string;
  relatedPackages?: Array<{ label: string; href: string }>;
};

type FrontmatterFields = Record<string, string | number | boolean | null | undefined>;
type Badge = { label: string; tone: string; system: string };
type CallableSignature = {
  name: string;
  detail: string;
  full: string;
  params: { name: string; type: string; defaultValue: string }[];
  returns: string;
  callable: boolean;
};
type SymbolListOptions = {
  anchorContext?: string;
  badgeSystem?: string;
  includeDetails?: boolean;
  language?: 'rust' | 'ts';
};

export function frontmatter(fields: FrontmatterFields): string {
  let md = '---\n';
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    md += `${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}\n`;
  }
  return `${md}---\n\n`;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeTableCell(value: unknown): string {
  return String(value || '')
    .replaceAll('|', '\\|')
    .replace(/\s+/g, ' ')
    .trim();
}

export function referenceSymbolLocation(symbol: ReferenceSymbol): string {
  const file = symbol.file || symbol.location;
  return symbol.line ? `${file}:${symbol.line}` : file;
}

export function compareReferenceSymbols(a: ReferenceSymbol, b: ReferenceSymbol): number {
  const leftFile = a.file || a.location;
  const rightFile = b.file || b.location;
  const leftLine = typeof a.line === 'number' ? a.line : 0;
  const rightLine = typeof b.line === 'number' ? b.line : 0;
  return a.name.localeCompare(b.name) || leftFile.localeCompare(rightFile) || leftLine - rightLine;
}

export function methodBaseName(symbol: ReferenceSymbol): string {
  return symbol.name.split('.').pop() || symbol.name;
}

function topLevelTokenIndexes(value: string, token: string): number[] {
  const indexes: number[] = [];
  let paren = 0;
  let brace = 0;
  let bracket = 0;
  let angle = 0;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '(') paren++;
    else if (char === ')') paren = Math.max(0, paren - 1);
    else if (char === '{') brace++;
    else if (char === '}') brace = Math.max(0, brace - 1);
    else if (char === '[') bracket++;
    else if (char === ']') bracket = Math.max(0, bracket - 1);
    else if (char === '<') angle++;
    else if (char === '>') angle = Math.max(0, angle - 1);

    if (
      value.startsWith(token, index) &&
      paren === 0 &&
      brace === 0 &&
      bracket === 0 &&
      angle === 0
    )
      indexes.push(index);
  }
  return indexes;
}

function splitTopLevel(value: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (const index of topLevelTokenIndexes(value, separator)) {
    parts.push(value.slice(start, index).trim());
    start = index + separator.length;
  }
  const tail = value.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function firstTopLevelIndex(value: string, token: string): number {
  return topLevelTokenIndexes(value, token)[0] ?? -1;
}

function parseParam(raw: string): { name: string; type: string; defaultValue: string } {
  const defaultIndex = firstTopLevelIndex(raw, '=');
  const withoutDefault = defaultIndex === -1 ? raw : raw.slice(0, defaultIndex).trim();
  const defaultValue = defaultIndex === -1 ? '' : raw.slice(defaultIndex + 1).trim();
  const typeIndex = firstTopLevelIndex(withoutDefault, ':');
  if (typeIndex === -1) return { name: withoutDefault, type: '', defaultValue };
  return {
    name: withoutDefault.slice(0, typeIndex).trim(),
    type: withoutDefault.slice(typeIndex + 1).trim(),
    defaultValue,
  };
}

function splitSymbolSignature(
  symbol: ReferenceSymbol
): Pick<CallableSignature, 'name' | 'detail' | 'full'> {
  const signature = symbol.signature || symbol.name;
  for (const name of [methodBaseName(symbol), symbol.name]) {
    if (signature.startsWith(name)) {
      return { name, detail: signature.slice(name.length), full: signature };
    }
  }
  return { name: '', detail: signature, full: signature };
}

function parseCallableSignature(symbol: ReferenceSymbol): CallableSignature {
  const signature = splitSymbolSignature(symbol);
  const detail = signature.detail.trim();
  if (!signature.name || !detail.startsWith('(')) {
    return { ...signature, params: [], returns: '', callable: false };
  }

  let depth = 0;
  let closeIndex = -1;
  for (let i = 0; i < detail.length; i++) {
    if (detail[i] === '(') depth++;
    if (detail[i] === ')') {
      depth--;
      if (depth === 0) {
        closeIndex = i;
        break;
      }
    }
  }
  if (closeIndex === -1) return { ...signature, params: [], returns: '', callable: false };

  const paramsSource = detail.slice(1, closeIndex).trim();
  const afterParams = detail.slice(closeIndex + 1).trim();
  return {
    ...signature,
    params: paramsSource ? splitTopLevel(paramsSource, ',').map(parseParam) : [],
    returns: afterParams.startsWith('->') ? afterParams.slice(2).trim() : '',
    callable: true,
  };
}

export function slugify(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeAnchorId(value: unknown): string {
  return String(value || 'symbol')
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function firstSignatureToken(signature: unknown): string {
  return (
    String(signature || 'symbol')
      .trim()
      .split(/[ (<]/)[0] || 'symbol'
  );
}

function sourceParts(location: string): { dir: string; file: string } {
  const slash = location.lastIndexOf('/');
  return slash === -1
    ? { dir: '', file: location }
    : { dir: location.slice(0, slash + 1), file: location.slice(slash + 1) };
}

function actionBadge(symbol: ReferenceSymbol): Badge {
  const name = methodBaseName(symbol).toLowerCase();
  if (/^(get|list|is|can|should|find|has|read)/.test(name))
    return { label: 'READ', tone: 'read', system: 'action' };
  if (/^(create|add|new|open|join|merge|load|accept|receive|request)/.test(name))
    return { label: 'CREATE', tone: 'create', system: 'action' };
  if (/^(delete|remove|detach|clear|reset|reject|undock|close|off)/.test(name))
    return { label: 'DELETE', tone: 'delete', system: 'action' };
  return { label: 'UPDATE', tone: 'update', system: 'action' };
}

function kindBadge(symbol: Pick<ReferenceSymbol, 'kind'>): Badge {
  if (symbol.kind === 'Class') return { label: 'CLASS', tone: 'class', system: 'kind' };
  if (symbol.kind === 'Const') return { label: 'CONST', tone: 'const', system: 'kind' };
  if (symbol.kind === 'Function') return { label: 'FUNCTION', tone: 'function', system: 'kind' };
  if (symbol.kind === 'Interface') return { label: 'INTERFACE', tone: 'type', system: 'kind' };
  if (symbol.kind === 'TypeAlias') return { label: 'TYPE', tone: 'type', system: 'kind' };
  return { label: symbol.kind.toUpperCase(), tone: 'type', system: 'kind' };
}

function renderBadge(badge: Badge): string {
  if (badge.system === 'action') {
    return `<span class="api-badge api-badge--action api-badge--${badge.tone}"><span class="api-badge__dot"></span>${escapeHtml(badge.label)}</span>`;
  }
  return `<span class="api-badge api-badge--kind api-badge--${badge.tone}">${escapeHtml(badge.label)}</span>`;
}

function renderSignature(
  signature: { name: string; full: string },
  symbol: ReferenceSymbol
): string {
  const name = signature.name || symbol.name;
  const index = name ? signature.full.indexOf(name) : -1;
  if (index === -1) return escapeHtml(signature.full);
  return `${escapeHtml(signature.full.slice(0, index))}<span class="api-member__signature-name">${escapeHtml(name)}</span>${escapeHtml(signature.full.slice(index + name.length))}`;
}

export function renderSymbolList(
  symbols: ReferenceSymbol[],
  options: SymbolListOptions = {}
): string {
  if (symbols.length === 0) return '<p><em>No symbols in this group.</em></p>\n';

  const sorted = [...symbols].sort(
    options.language === 'rust'
      ? (a, b): number => a.name.localeCompare(b.name)
      : compareReferenceSymbols
  );
  let md = '<div class="api-member-list">\n';
  for (const symbol of sorted) {
    const signature =
      options.language === 'rust'
        ? {
            name: symbol.name,
            detail: '',
            full: symbol.signature || symbol.name,
            params: [],
            returns: '',
            callable: false,
          }
        : parseCallableSignature(symbol);
    const location =
      options.language === 'rust' ? symbol.location : referenceSymbolLocation(symbol);
    const source = sourceParts(location);
    const anchorId = sanitizeAnchorId(
      `${symbol.name || firstSignatureToken(symbol.signature)}-${location}${options.anchorContext ? `-${options.anchorContext}` : ''}`
    );
    const badge = options.badgeSystem === 'action' ? actionBadge(symbol) : kindBadge(symbol);
    const searchText = [symbol.name, signature.full, symbol.doc, location]
      .filter(Boolean)
      .join(' ');
    md += `  <article id="${anchorId}" class="api-member api-member--${badge.system}-${badge.tone}" data-symbol-card data-symbol-name="${escapeHtml(symbol.name)}" data-symbol-signature="${escapeHtml(signature.full)}" data-symbol-description="${escapeHtml(symbol.doc || '')}" data-symbol-search="${escapeHtml(searchText)}">\n`;
    md += `    <div class="api-member__badge-row">${renderBadge(badge)}</div>\n`;
    md += `    <pre class="api-member__signature"><code>${renderSignature(signature, symbol)}</code></pre>\n`;
    if (symbol.doc) md += `    <p class="api-member__description">${escapeHtml(symbol.doc)}</p>\n`;
    if (options.includeDetails !== false && signature.params.length) {
      md += '    <dl class="api-member__params">\n';
      for (const param of signature.params) {
        md += '      <div class="api-member__param">\n';
        md += `        <dt>${escapeHtml(param.name)}</dt>\n`;
        md += `        <dd><code>${escapeHtml(param.type || 'value')}</code>${param.defaultValue ? ` <span class="api-member__default">= ${escapeHtml(param.defaultValue)}</span>` : ''}</dd>\n`;
        md += '      </div>\n';
      }
      md += '    </dl>\n';
    }
    if (options.includeDetails !== false && signature.returns) {
      md += `    <div class="api-member__return"><span>Returns</span><code>${escapeHtml(signature.returns)}</code></div>\n`;
    }
    md += '    <footer class="api-member__footer">\n';
    md += `      <code class="api-member__source" title="${escapeHtml(location)}"><span class="api-member__source-dir">${escapeHtml(source.dir)}</span><span class="api-member__source-file">${escapeHtml(source.file)}</span></code>\n`;
    md += '      <span class="api-member__actions">\n';
    md += `        <a class="api-member__permalink" href="#${anchorId}" aria-label="Permalink to ${escapeHtml(symbol.name || firstSignatureToken(signature.full))}">#</a>\n`;
    md += `        <button class="api-member__copy" type="button" data-copy-signature="${escapeHtml(signature.full)}">Copy</button>\n`;
    md += '      </span>\n';
    md += '    </footer>\n';
    md += '  </article>\n';
  }
  return `${md}</div>\n`;
}

export function renderCollapse({
  id,
  title,
  content,
  open = false,
  blurb = '',
}: {
  id: string;
  title: string;
  content: string;
  open?: boolean;
  blurb?: string;
}): string {
  const domId = `group-${slugify(id || title)}`;
  const blurbMarkup = blurb
    ? `\n      <span class="api-reference__group-blurb">${escapeHtml(blurb)}</span>`
    : '';
  return `<details id="${domId}" class="md-collapse api-reference__group" data-symbol-group data-group-id="${escapeHtml(slugify(id || title))}" ${open ? 'open' : ''}>
  <summary class="md-collapse__summary">
    <svg class="md-collapse__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="md-collapse__heading">
      <span class="md-collapse__title">${escapeHtml(title)}</span>${blurbMarkup}
    </span>
  </summary>
  <div class="md-collapse__content">
${content}
  </div>
</details>

`;
}

function symbolsByKind(symbols: ReferenceSymbol[]): Record<string, ReferenceSymbol[]> {
  const byKind: Record<string, ReferenceSymbol[]> = {};
  for (const symbol of symbols) (byKind[symbol.kind] ||= []).push(symbol);
  return byKind;
}

function orderedKinds(byKind: Record<string, ReferenceSymbol[]>): string[] {
  const order = ['Class', 'Const', 'Function', 'Interface', 'Method', 'TypeAlias'];
  return [
    ...order.filter((kind) => byKind[kind]?.length),
    ...Object.keys(byKind)
      .filter((kind) => !order.includes(kind))
      .sort(),
  ];
}

export function renderSymbolSummary(symbols: ReferenceSymbol[]): string {
  const byKind = symbolsByKind(symbols);
  let md =
    '<table class="api-reference__kind-table">\n<thead><tr><th>Kind</th><th>Symbols</th></tr></thead>\n<tbody>\n';
  for (const kind of orderedKinds(byKind)) {
    md += `<tr data-kind-row data-target-group="kind-${slugify(kind)}" role="button" tabindex="0"><td><span class="api-reference__kind-cell"><span>${escapeHtml(kind)}</span><span class="api-reference__jump-arrow" aria-hidden="true">&darr;</span></span></td><td>${byKind[kind].length}</td></tr>\n`;
  }
  return `${md}</tbody>\n</table>\n\n`;
}

export function renderRawSymbolIndex(
  symbols: ReferenceSymbol[],
  options: { language: 'rust' | 'ts'; openKinds?: string[]; includeDetails?: boolean }
): string {
  const byKind = symbolsByKind(symbols);
  let md =
    '<p>Use this section when you already know the symbol name and need its source location.</p>\n\n';
  md += renderLegend('kind', orderedKinds(byKind));
  if (symbols.length === 0)
    return `${md}_No public ${options.language === 'rust' ? 'Rust' : 'TypeScript'} symbols found._\n`;

  const openKinds = new Set(options.openKinds || []);
  for (const kind of orderedKinds(byKind)) {
    const group = byKind[kind];
    md += renderCollapse({
      id: `kind-${kind}`,
      title: `${kind} (${group.length})`,
      content: renderSymbolList(group, {
        language: options.language,
        badgeSystem: options.language === 'ts' ? 'kind' : undefined,
        anchorContext: `raw-${slugify(kind)}`,
        includeDetails: options.includeDetails,
      }),
      open: openKinds.has(kind),
    });
  }
  return md;
}

const legendBadges: Record<string, Badge[]> = {
  action: [
    { label: 'CREATE', tone: 'create', system: 'action' },
    { label: 'READ', tone: 'read', system: 'action' },
    { label: 'UPDATE', tone: 'update', system: 'action' },
    { label: 'DELETE', tone: 'delete', system: 'action' },
  ],
  kind: [
    { label: 'CLASS', tone: 'class', system: 'kind' },
    { label: 'CONST', tone: 'const', system: 'kind' },
    { label: 'FUNCTION', tone: 'function', system: 'kind' },
    { label: 'TYPE', tone: 'type', system: 'kind' },
    { label: 'INTERFACE', tone: 'type', system: 'kind' },
  ],
};

export function renderLegend(system: string, kinds: string[] = []): string {
  const seen = new Set<string>();
  const badges = (
    system === 'kind' && kinds.length
      ? kinds.map((kind) => kindBadge({ kind }))
      : legendBadges[system] || []
  ).filter((badge) => {
    const key = `${badge.system}:${badge.label}:${badge.tone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const label = system === 'action' ? 'Action badge legend' : 'Kind badge legend';
  return `<div class="api-reference__legend" aria-label="${label}">
  ${badges.map(renderBadge).join('\n  ')}
</div>

`;
}

export function renderReferenceSection(id: string, title: string, body: string): string {
  return `<section id="${id}" class="api-reference__section" data-reference-section>
<h2>${escapeHtml(title)}</h2>

${body}
</section>

`;
}

export function defaultReferenceIntro(
  pkg: ReferencePackage,
  language: 'Rust' | 'TypeScript'
): string {
  if (pkg.description) {
    return `${escapeHtml(sentence(pkg.description))} Generated from ${language === 'TypeScript' ? 'package exports in ' : ''}<code>${escapeHtml(pkg.path)}</code>. Start with the summary, then open the raw symbol groups when you need exact signatures or source locations.`;
  }
  return `Public ${language} API surface for <strong>${escapeHtml(pkg.title)}</strong>, generated from <code>${escapeHtml(pkg.path)}</code>. Start with the summary, then open the raw symbol groups when you need exact signatures or source locations.`;
}

export function sentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function renderReferenceFooter(config: ReferencePageConfig = {}): string {
  let md = '<footer class="api-reference__footer">\n';
  if (config.relatedPackages?.length) {
    md += '<h2>Related Packages</h2>\n<ul>\n';
    for (const { label, href } of config.relatedPackages) {
      md += `  <li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>\n`;
    }
    md += '</ul>\n';
  }
  return `${md}<p>${referenceBanner.replace(/^> /, '')}</p>\n</footer>\n`;
}

function renderReaderGuide(
  hasEntryPoints: boolean,
  hasGuide: boolean,
  symbolCount: number
): string {
  const items = [['Summary', '#overview', 'Start with counts and package context.']];
  if (hasEntryPoints)
    items.push(['Entry points', '#entry-points', 'Use this before guessing import paths.']);
  if (hasGuide)
    items.push(['Curated groups', '#primary-api', 'Use these before opening the full raw index.']);
  items.push(['Raw index', '#raw-symbol-index', `${symbolCount} generated symbols by kind.`]);

  let md = '<nav class="api-reference__reader-guide" aria-label="Reference reading guide">\n';
  for (const [label, href, description] of items) {
    md += `  <a class="api-reference__reader-guide-item" href="${href}"><span>${escapeHtml(label)}</span><small>${escapeHtml(description)}</small></a>\n`;
  }
  return `${md}</nav>\n\n`;
}

export function renderReferencePage(input: {
  pkg: ReferencePackage;
  description: string;
  intro: string;
  symbolCount: number;
  overview: string;
  entryPoints?: string;
  guide?: string;
  rawIndex: string;
  footerConfig?: ReferencePageConfig;
}): string {
  const { pkg, entryPoints = '', guide = '', footerConfig = {} } = input;
  let md = frontmatter({
    title: pkg.title,
    description: input.description,
    section: 'Reference',
    order: pkg.order,
  });
  md += `<div class="api-reference" data-reference-page data-reference-title="${escapeHtml(pkg.title)}">
<section class="api-reference__hero">
<h1>${escapeHtml(pkg.title)}</h1>
<p>${input.intro}</p>
</section>

<p class="api-reference__source-line"><strong>Source:</strong> <code>${escapeHtml(pkg.path)}</code> · ${input.symbolCount} public symbols</p>
${renderReaderGuide(Boolean(entryPoints), Boolean(guide), input.symbolCount)}
<div class="api-reference__search-status" data-reference-search-status hidden></div>
<div class="api-reference__empty" data-reference-empty hidden>No symbols match your search. Try a different term, or press Esc to clear.</div>

`;
  md += renderReferenceSection('overview', 'Overview', input.overview);
  if (entryPoints) md += renderReferenceSection('entry-points', 'Entry Points', entryPoints);
  md += guide;
  md += renderReferenceSection('raw-symbol-index', 'Raw Symbol Index', input.rawIndex);
  return `${md}${renderReferenceFooter(footerConfig)}</div>\n`;
}

function coveragePercent(item: CoverageItem): number {
  return item.total === 0 ? 100 : (item.documented / item.total) * 100;
}

export function printCoverageReport(
  items: CoverageItem[],
  showMissing: boolean
): { documented: number; total: number; missing: number } {
  const totals = items.reduce(
    (acc, item) => ({
      documented: acc.documented + item.documented,
      total: acc.total + item.total,
      missing: acc.missing + item.missing.length,
    }),
    { documented: 0, total: 0, missing: 0 }
  );
  console.log('\nSource comment coverage:');
  for (const item of [...items].sort((a, b) => coveragePercent(a) - coveragePercent(b))) {
    console.log(
      `  - ${item.label}: ${item.documented}/${item.total} (${coveragePercent(item).toFixed(1)}%)`
    );
    if (showMissing) {
      for (const symbol of item.missing.slice(0, 12))
        console.log(`    missing ${symbol.kind} ${symbol.name} at ${symbol.file}`);
      if (item.missing.length > 12)
        console.log(`    plus ${item.missing.length - 12} more missing symbol(s)`);
    }
  }
  const totalPercent = totals.total === 0 ? 100 : (totals.documented / totals.total) * 100;
  console.log(`  - total: ${totals.documented}/${totals.total} (${totalPercent.toFixed(1)}%)`);
  return totals;
}
