import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { Project } from 'ts-morph';

interface DocNode {
  getJsDocs(): Array<{ getDescription(): string }>;
}
interface NamedNode {
  getName(): string | undefined;
  getStartLineNumber(): number;
  isExported(): boolean;
}
interface ParamNode {
  getText(): string;
}
interface TypeNode {
  getText(): string;
}
interface MethodNode extends DocNode {
  getName(): string;
  getStartLineNumber(): number;
  getScope(): string;
  isStatic(): boolean;
  isOverload(): boolean;
  getParameters(): ParamNode[];
  getReturnTypeNode(): TypeNode | undefined;
}
interface SourceFileNode {
  getFunctions(): Array<
    NamedNode &
      DocNode & {
        isOverload(): boolean;
        getParameters(): ParamNode[];
        getReturnTypeNode(): TypeNode | undefined;
      }
  >;
  getInterfaces(): Array<
    NamedNode &
      DocNode & {
        getExtends(): TypeNode[];
        getTypeParameters(): TypeNode[];
        getMembers(): unknown[];
      }
  >;
  getTypeAliases(): Array<
    NamedNode &
      DocNode & {
        getTypeParameters(): TypeNode[];
        getTypeNode(): TypeNode | undefined;
      }
  >;
  getEnums(): Array<
    NamedNode &
      DocNode & {
        isConstEnum(): boolean;
        getMembers(): Array<{ getName(): string }>;
      }
  >;
  getClasses(): Array<
    NamedNode &
      DocNode & {
        getTypeParameters(): TypeNode[];
        getExtends(): TypeNode | undefined;
        getImplements(): TypeNode[];
        getMethods(): MethodNode[];
      }
  >;
  getVariableStatements(): Array<
    DocNode & {
      isExported(): boolean;
      getDeclarationKind(): string;
      getDeclarations(): Array<{
        getName(): string;
        getStartLineNumber(): number;
        getTypeNode(): TypeNode | undefined;
      }>;
    }
  >;
}
interface ProjectInstance {
  createSourceFile(path: string, source: string, opts: { overwrite: boolean }): SourceFileNode;
  removeSourceFile(sf: SourceFileNode): void;
}
// Built from its char code so this file never contains the literal U+2014 it bans.
const EM_DASH = String.fromCharCode(0x2014);

// Directories codeatlas skips when walking a package (see its TypeScript
// LanguageDefinition.ignored_dirs). We match it so our file set, and therefore
// the function list, lines up with the pages this replaces.
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'target',
  '__pycache__',
  '__tests__',
  '__mocks__',
  'fixtures',
]);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const TEST_FILE_PATTERN = /(?:^|[./])[^/]*\.(?:test|spec)\.[^/]+$/;

export interface WorkspaceReferenceSymbol {
  kind: string;
  name: string;
  signature: string;
  file: string;
  line: number;
  doc: string;
}

interface VirtualFile {
  // Path under the package, used for the displayed `file:line`.
  relPath: string;
  // TypeScript source ts-morph should parse.
  source: string;
  // Number added to a node's in-source line number to get the line in the file
  // shown to readers. 0 for plain sources; the <script> body start for .svelte.
  lineOffset: number;
}

type ExportNameFilter = Set<string> | null;
export type PackageExportFilter = (exportKey: string) => boolean;

interface ReExportName {
  localName: string;
  exportedName: string;
}

interface ReExportDeclaration {
  specifier: string;
  names: ReExportName[] | null;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

function isSourceFilePath(path: string): boolean {
  const ext = extOf(path);
  return ext === '.svelte' || SOURCE_EXTENSIONS.has(ext);
}

function shouldSkipSourcePath(path: string): boolean {
  if (TEST_FILE_PATTERN.test(path)) return true;
  return path.split('/').some((part) => IGNORED_DIRS.has(part));
}

// Recursively collect candidate source paths under a package directory, applying
// the same directory ignores codeatlas uses. Returns paths relative to pkgDir,
// always with forward slashes so output is stable across platforms.
function collectFiles(pkgDir: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    // Sort for deterministic traversal regardless of filesystem order.
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !isNestedPackageRoot(pkgDir, full)) walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const rel = relative(pkgDir, full).split(sep).join('/');
      if (isSourceFilePath(rel) && !shouldSkipSourcePath(rel)) out.push(rel);
    }
  };
  walk(pkgDir);
  return out.sort();
}

function isNestedPackageRoot(pkgDir: string, dir: string): boolean {
  return dir !== pkgDir && existsSync(join(dir, 'package.json'));
}

function readPackageJson(pkgDir: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function collectExportValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
    return out;
  }

  if (!value || typeof value !== 'object') return out;

  for (const next of Object.values(value as Record<string, unknown>)) {
    collectExportValues(next, out);
  }

  return out;
}

function normalizePackagePath(path: string): string {
  return path.replace(/^\.\//, '').split(sep).join('/');
}

function collectPackageExportValues(
  pkg: Record<string, unknown>,
  includeExport: PackageExportFilter
): string[] {
  const values: string[] = [];
  const exportsField = pkg.exports;

  if (exportsField && typeof exportsField === 'object' && !Array.isArray(exportsField)) {
    for (const [key, value] of Object.entries(exportsField as Record<string, unknown>)) {
      if (!key.startsWith('.') || includeExport(key)) {
        collectExportValues(value, values);
      }
    }
  } else {
    collectExportValues(exportsField, values);
  }

  collectExportValues(pkg.source, values);
  collectExportValues(pkg.types, values);
  collectExportValues(pkg.module, values);
  collectExportValues(pkg.main, values);

  return values;
}

function sourceCandidatesForExportValue(value: string): string[] {
  const normalized = normalizePackagePath(value);
  const candidates = [normalized];
  const sourceLike = normalized
    .replace(/^dist\/(?:types|node|worker)\//, 'src/')
    .replace(/^dist\//, 'src/')
    .replace(/\.d\.ts$/, '.ts')
    .replace(/\.(?:js|mjs|cjs|jsx)$/, '.ts');
  candidates.push(sourceLike);
  if (sourceLike.endsWith('/index.ts')) candidates.push(sourceLike);
  if (
    !sourceLike.endsWith('.ts') &&
    !sourceLike.endsWith('.tsx') &&
    !sourceLike.endsWith('.svelte')
  ) {
    candidates.push(
      `${sourceLike}.ts`,
      `${sourceLike}.tsx`,
      `${sourceLike}/index.ts`,
      `${sourceLike}/index.tsx`
    );
  }
  return [...new Set(candidates)];
}

function sourceEntrypoints(
  pkgDir: string,
  availableFiles: Set<string>,
  includeExport: PackageExportFilter
): string[] {
  const pkg = readPackageJson(pkgDir);
  if (!pkg) return [];

  const entrypoints = new Set<string>();
  for (const value of collectPackageExportValues(pkg, includeExport)) {
    for (const candidate of sourceCandidatesForExportValue(value)) {
      if (!isSourceFilePath(candidate) || shouldSkipSourcePath(candidate)) continue;
      if (availableFiles.has(candidate)) entrypoints.add(candidate);
    }
  }

  return [...entrypoints].sort();
}

function stripSpecifierComments(specifierList: string): string {
  return specifierList.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '$1');
}

function parseReExportNames(specifierList: string): ReExportName[] {
  const names: ReExportName[] = [];
  for (const rawPart of stripSpecifierComments(specifierList).split(',')) {
    const part = rawPart.trim().replace(/^type\s+/, '');
    if (!part) continue;

    const aliasMatch = part.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (aliasMatch) {
      names.push({
        localName: aliasMatch[1],
        exportedName: aliasMatch[2],
      });
      continue;
    }

    const nameMatch = part.match(/^[A-Za-z_$][\w$]*$/);
    if (!nameMatch) continue;

    names.push({
      localName: part,
      exportedName: part,
    });
  }
  return names;
}

function reExportDeclarations(source: string): ReExportDeclaration[] {
  const declarations: ReExportDeclaration[] = [];
  // Inputs are local package source files, and multiline named exports require a broad matcher.
  const reExportPattern =
    /export\s+(?:type\s+)?(?:\*\s+as\s+[A-Za-z_$][\w$]*|\*|\{([^}]*)\})\s+from\s+['"]([^'"]+)['"]/g; // eslint-disable-line security/detect-unsafe-regex
  for (const match of source.matchAll(reExportPattern)) {
    declarations.push({
      specifier: match[2],
      names: match[1] === undefined ? null : parseReExportNames(match[1]),
    });
  }
  return declarations;
}

function resolveRelativeModule(
  fromRelPath: string,
  specifier: string,
  availableFiles: Set<string>
): string | null {
  if (!specifier.startsWith('.')) return null;

  const rawBase = normalizePackagePath(join(dirname(fromRelPath), specifier));
  const rawExt = extOf(rawBase);
  const base = ['.js', '.jsx', '.mjs', '.cjs'].includes(rawExt)
    ? rawBase.slice(0, -rawExt.length)
    : rawBase;
  const candidates = [
    rawBase,
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}.svelte`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.js`,
    `${base}/index.jsx`,
    `${base}/index.mjs`,
    `${base}/index.cjs`,
    `${base}/index.svelte`,
  ];

  for (const candidate of candidates) {
    if (availableFiles.has(candidate)) return candidate;
  }

  return null;
}

function addReachableFile(
  reachable: Map<string, ExportNameFilter>,
  relPath: string,
  names: ExportNameFilter
): boolean {
  const current = reachable.get(relPath);
  if (current === null) return false;

  if (names === null) {
    reachable.set(relPath, null);
    return current !== null;
  }

  if (names.size === 0) return false;

  if (!current) {
    reachable.set(relPath, new Set(names));
    return true;
  }

  let changed = false;
  for (const name of names) {
    if (current.has(name)) continue;
    current.add(name);
    changed = true;
  }
  return changed;
}

function forwardedExportNames(
  currentFilter: ExportNameFilter,
  reExportNames: ReExportName[] | null
): ExportNameFilter {
  if (currentFilter === null) {
    if (reExportNames === null) return null;
    return new Set(reExportNames.map((name) => name.localName));
  }

  if (reExportNames === null) return new Set(currentFilter);

  const forwarded = new Set<string>();
  for (const name of reExportNames) {
    if (currentFilter.has(name.exportedName)) forwarded.add(name.localName);
  }
  return forwarded;
}

function collectExportReachableFiles(
  pkgDir: string,
  allFiles: string[],
  includeExport: PackageExportFilter
): Map<string, ExportNameFilter> {
  const availableFiles = new Set(allFiles);
  const entrypoints = sourceEntrypoints(pkgDir, availableFiles, includeExport);
  if (entrypoints.length === 0) return new Map(allFiles.map((file) => [file, null]));

  const reachable = new Map<string, ExportNameFilter>();
  const queue: Array<{ relPath: string; names: ExportNameFilter }> = entrypoints.map((relPath) => ({
    relPath,
    names: null,
  }));

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next || !availableFiles.has(next.relPath)) continue;
    if (!addReachableFile(reachable, next.relPath, next.names)) continue;

    let content: string;
    try {
      content = readFileSync(join(pkgDir, next.relPath), 'utf-8');
    } catch {
      continue;
    }

    for (const declaration of reExportDeclarations(content)) {
      const resolved = resolveRelativeModule(next.relPath, declaration.specifier, availableFiles);
      if (!resolved) continue;
      queue.push({
        relPath: resolved,
        names: forwardedExportNames(next.names, declaration.names),
      });
    }
  }

  return new Map([...reachable.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

// Turn a .svelte file into the TypeScript script blocks it contains, each
// carrying the line offset of its body within the .svelte file so reported line
// numbers point at the real source (matching codeatlas).
function svelteScriptBlocks(relPath: string, content: string): VirtualFile[] {
  const blocks: VirtualFile[] = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    if (/^\s*<script\b/.test(lines[i])) {
      // The opening <script ...> tag may span lines; find where it closes.
      let openEnd = i;
      while (openEnd < lines.length && !lines[openEnd].includes('>')) openEnd++;
      const bodyStart = openEnd + 1;
      let bodyEnd = bodyStart;
      while (bodyEnd < lines.length && !/<\/script>/i.test(lines[bodyEnd])) bodyEnd++;
      const body = lines.slice(bodyStart, bodyEnd).join('\n');
      blocks.push({
        relPath,
        source: body,
        // bodyStart is 0-based; in-block line 1 maps to file line bodyStart + 1,
        // so the offset added to a 1-based node line number is exactly bodyStart.
        lineOffset: bodyStart,
      });
      i = bodyEnd + 1;
      continue;
    }
    i++;
  }
  return blocks;
}

// First paragraph of a JSDoc description: keep text up to the first blank line,
// collapse whitespace to single spaces, and strip the banned em-dash. Returns ''
// when the node has no JSDoc text.
function jsDocSummary(node: DocNode): string {
  const docs = node.getJsDocs();
  if (docs.length === 0) return '';
  const description = docs[docs.length - 1].getDescription();
  if (!description) return '';
  const paragraph = description.replace(/\r/g, '').split(/\n\s*\n/)[0];
  return (
    paragraph
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
      // Replace the banned em-dash before collapsing whitespace, then drop any
      // space that ended up before the inserted comma, so a spaced ` U+2014 `
      // reads as "word, word" rather than "word ,  word".
      .split(EM_DASH)
      .join(',')
      .replace(/\s+/g, ' ')
      .replace(/ ,/g, ',')
      .trim()
  );
}

// Collapse a multi-line signature fragment to a single tidy line.
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Final guard on a rendered signature: collapse any residual newlines (e.g. a
// multi-line generic constraint or inline object type that survived per-fragment
// flattening) and cap the length so one symbol can never blow up a page or break
// the single-line markdown bullet it lives on. Mirrors the Rust pages, which also
// truncate long signatures with an ellipsis.
const MAX_SIGNATURE_LENGTH = 160;
function finalizeSignature(signature: string): string {
  const flat = oneLine(signature);
  return flat.length > MAX_SIGNATURE_LENGTH
    ? `${flat.slice(0, MAX_SIGNATURE_LENGTH - 3)}...`
    : flat;
}

function extractFromSourceFile(
  sf: SourceFileNode,
  relPath: string,
  offset: number,
  exportNameFilter: ExportNameFilter
): WorkspaceReferenceSymbol[] {
  const symbols: WorkspaceReferenceSymbol[] = [];
  const lineOf = (node: { getStartLineNumber(): number }): number =>
    node.getStartLineNumber() + offset;
  const shouldInclude = (name: string): boolean =>
    exportNameFilter === null || exportNameFilter.has(name);

  for (const fn of sf.getFunctions()) {
    const name = fn.getName();
    if (!fn.isExported() || !name) continue;
    if (!shouldInclude(name)) continue;
    // ts-morph yields a node per overload signature plus the implementation;
    // only emit the implementation (or a lone signature) to avoid duplicates.
    if (fn.isOverload()) continue;
    const params = fn
      .getParameters()
      .map((p) => p.getText())
      .join(', ');
    const ret = fn.getReturnTypeNode();
    const retText = ret ? ` -> ${oneLine(ret.getText())}` : '';
    symbols.push({
      kind: 'Function',
      name,
      signature: finalizeSignature(`function ${name}(${oneLine(params)})${retText}`),
      file: relPath,
      line: lineOf(fn),
      doc: jsDocSummary(fn),
    });
  }

  for (const decl of sf.getInterfaces()) {
    const name = decl.getName();
    if (!decl.isExported() || !name) continue;
    if (!shouldInclude(name)) continue;
    const typeParams = decl.getTypeParameters().map((t) => t.getText());
    const generics = typeParams.length ? `<${typeParams.join(', ')}>` : '';
    const heritage = decl.getExtends();
    const ext = heritage.length
      ? ` extends ${heritage.map((h) => oneLine(h.getText())).join(', ')}`
      : '';
    const body = decl.getMembers().length ? ' { ... }' : ' {}';
    symbols.push({
      kind: 'Interface',
      name,
      signature: finalizeSignature(`interface ${name}${generics}${ext}${body}`),
      file: relPath,
      line: lineOf(decl),
      doc: jsDocSummary(decl),
    });
  }

  for (const decl of sf.getTypeAliases()) {
    const name = decl.getName();
    if (!decl.isExported() || !name) continue;
    if (!shouldInclude(name)) continue;
    const typeParams = decl.getTypeParameters().map((t) => t.getText());
    const generics = typeParams.length ? `<${typeParams.join(', ')}>` : '';
    let body = oneLine(decl.getTypeNode()?.getText() ?? 'unknown');
    // Keep aliases readable: collapse a long object/union body to an ellipsis.
    if (body.length > 80) body = body.startsWith('{') ? '{ ... }' : `${body.slice(0, 77)}...`;
    symbols.push({
      kind: 'TypeAlias',
      name,
      signature: finalizeSignature(`type ${name}${generics} = ${body}`),
      file: relPath,
      line: lineOf(decl),
      doc: jsDocSummary(decl),
    });
  }

  for (const decl of sf.getEnums()) {
    const name = decl.getName();
    if (!decl.isExported() || !name) continue;
    if (!shouldInclude(name)) continue;
    const members = decl.getMembers().map((m) => m.getName());
    const shown = members.slice(0, 4).join(', ');
    const suffix = members.length > 4 ? ', ...' : '';
    const body = members.length ? ` { ${shown}${suffix} }` : ' {}';
    const constPrefix = decl.isConstEnum() ? 'const ' : '';
    symbols.push({
      kind: 'Enum',
      name,
      signature: finalizeSignature(`${constPrefix}enum ${name}${body}`),
      file: relPath,
      line: lineOf(decl),
      doc: jsDocSummary(decl),
    });
  }

  for (const decl of sf.getClasses()) {
    const className = decl.getName();
    if (!decl.isExported() || !className) continue;
    if (!shouldInclude(className)) continue;
    const classDoc = jsDocSummary(decl);
    const typeParams = decl.getTypeParameters().map((t) => t.getText());
    const generics = typeParams.length ? `<${typeParams.join(', ')}>` : '';
    const extendedType = decl.getExtends();
    const ext = extendedType ? ` extends ${oneLine(extendedType.getText())}` : '';
    const impls = decl.getImplements();
    const implText = impls.length
      ? ` implements ${impls.map((i) => oneLine(i.getText())).join(', ')}`
      : '';
    symbols.push({
      kind: 'Class',
      name: className,
      signature: finalizeSignature(`class ${className}${generics}${ext}${implText}`),
      file: relPath,
      line: lineOf(decl),
      doc: classDoc,
    });
    // Public instance/static methods of the class (codeatlas groups these under
    // Method). Skip private (# or private modifier) and protected members.
    for (const method of decl.getMethods()) {
      const scope = method.getScope();
      if (scope === 'private' || scope === 'protected') continue;
      if (method.getName().startsWith('#')) continue;
      if (method.isOverload()) continue;
      const params = method
        .getParameters()
        .map((p) => p.getText())
        .join(', ');
      const ret = method.getReturnTypeNode();
      const retText = ret ? ` -> ${oneLine(ret.getText())}` : '';
      const staticPrefix = method.isStatic() ? 'static ' : '';
      symbols.push({
        kind: 'Method',
        name: `${className}.${method.getName()}`,
        signature: finalizeSignature(
          `${staticPrefix}${method.getName()}(${oneLine(params)})${retText}`
        ),
        file: relPath,
        line: method.getStartLineNumber() + offset,
        doc: jsDocSummary(method) || classDoc,
      });
    }
  }

  for (const stmt of sf.getVariableStatements()) {
    if (!stmt.isExported()) continue;
    const keyword = stmt.getDeclarationKind();
    const doc = jsDocSummary(stmt);
    // A statement can declare several names; emit one symbol per identifier.
    for (const declaration of stmt.getDeclarations()) {
      const name = declaration.getName();
      if (!name) continue;
      if (!shouldInclude(name)) continue;
      const typeNode = declaration.getTypeNode();
      const typeText = typeNode ? `: ${oneLine(typeNode.getText())}` : '';
      symbols.push({
        kind: 'Const',
        name,
        signature: finalizeSignature(`${keyword} ${name}${typeText}`),
        file: relPath,
        line: declaration.getStartLineNumber() + offset,
        doc,
      });
    }
  }

  return symbols;
}

function extractPackage(
  project: ProjectInstance,
  repoRoot: string,
  pkgPath: string,
  includeExport: PackageExportFilter
): WorkspaceReferenceSymbol[] {
  const pkgDir = join(repoRoot, pkgPath);
  let stats;
  try {
    stats = statSync(pkgDir);
  } catch {
    return [];
  }
  if (!stats.isDirectory()) return [];

  const symbols: WorkspaceReferenceSymbol[] = [];
  const reachableFiles = collectExportReachableFiles(pkgDir, collectFiles(pkgDir), includeExport);
  for (const [relPath, exportNameFilter] of reachableFiles) {
    const absPath = join(pkgDir, relPath);
    let content;
    try {
      content = readFileSync(absPath, 'utf-8');
    } catch {
      continue;
    }

    const virtuals: VirtualFile[] =
      extOf(relPath) === '.svelte'
        ? svelteScriptBlocks(relPath, content)
        : [{ relPath, source: content, lineOffset: 0 }];

    let blockCounter = 0;
    for (const virtual of virtuals) {
      blockCounter++;
      // Distinct in-memory name; ts-morph requires unique source file paths.
      const memName = `${pkgPath}/${relPath}__${blockCounter}.tsx`;
      let sf: SourceFileNode;
      try {
        sf = project.createSourceFile(memName, virtual.source, { overwrite: true });
      } catch {
        continue;
      }
      try {
        symbols.push(
          ...extractFromSourceFile(sf, virtual.relPath, virtual.lineOffset, exportNameFilter)
        );
      } finally {
        project.removeSourceFile(sf);
      }
    }
  }

  // Deterministic order: by kind, then name, then file, then line. The .mjs
  // re-groups by kind, but a stable order here keeps the JSON reproducible.
  symbols.sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) ||
      a.name.localeCompare(b.name) ||
      a.file.localeCompare(b.file) ||
      a.line - b.line
  );
  return symbols;
}

export function extractWorkspacePackageSymbols(options: {
  repoRoot: string;
  packagePaths: string[];
  includeExport?: PackageExportFilter;
}): Record<string, { symbols: WorkspaceReferenceSymbol[] }> {
  const includeExport = options.includeExport ?? ((_key: string): boolean => true);
  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    compilerOptions: { allowJs: true, noLib: true },
  }) as unknown as ProjectInstance;

  const result: Record<string, { symbols: WorkspaceReferenceSymbol[] }> = {};
  for (const packagePath of options.packagePaths) {
    result[packagePath] = {
      symbols: extractPackage(project, options.repoRoot, packagePath, includeExport),
    };
  }
  return result;
}
