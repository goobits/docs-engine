import fs from 'fs';
import path from 'path';

/**
 * Symbol definition from TypeDoc
 */
export interface SymbolDefinition {
  name: string;
  path: string;
  line: number;
  kind: 'type' | 'interface' | 'class' | 'function' | 'enum' | 'const';
  exported: boolean;
  jsDoc?: {
    description?: string;
    params?: Array<{ name: string; description: string; type: string }>;
    returns?: string;
    example?: string;
    see?: string[];
  };
  signature: string;
  related?: string[]; // Related symbol names extracted from type signatures
  extends?: string[]; // Parent types/interfaces this symbol extends
  implements?: string[]; // Interfaces this class implements
}

/**
 * Symbol map structure (from TypeDoc JSON)
 */
export interface SymbolMap {
  [symbolName: string]: SymbolDefinition[];
}

/**
 * Load symbol map from generated JSON file
 * Cached after first load for performance
 */
let cachedMap: SymbolMap | null = null;

export function loadSymbolMap(): SymbolMap {
  if (cachedMap) return cachedMap;

  // Try multiple possible paths (workspace root, web dir, etc.)
  const possiblePaths = [
    path.resolve('docs/.generated/symbol-map.json'),
    path.resolve('../docs/.generated/symbol-map.json'),
    path.resolve('../../docs/.generated/symbol-map.json'),
  ];

  let mapPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      mapPath = p;
      break;
    }
  }

  if (!mapPath) {
    throw new Error(
      'Symbol map not found. Run `pnpm docs:symbols` to generate it.'
    );
  }

  cachedMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8')) as SymbolMap;
  return cachedMap;
}

export function resolveSymbol(
  reference: string,
  symbolMap: SymbolMap
): SymbolDefinition {
  const [pathHint, symbolName] = parseReference(reference);
  const candidates = symbolMap[symbolName] || [];

  if (candidates.length === 0) {
    throw new AmbiguousSymbolError(symbolName, findSimilarSymbols(symbolName, symbolMap));
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (!pathHint) {
    throw new AmbiguousSymbolError(symbolName, candidates);
  }

  // Check if path hint includes a kind suffix (e.g., "types/enums/type" or "types/enums/const")
  const kindSuffixes = ['type', 'interface', 'class', 'function', 'enum', 'const'];
  let kindFilter: string | null = null;
  let pathOnly = pathHint;

  for (const kind of kindSuffixes) {
    if (pathHint.endsWith(`/${kind}`)) {
      kindFilter = kind;
      pathOnly = pathHint.slice(0, -(kind.length + 1));
      break;
    }
  }

  // Filter by path (and optionally by kind)
  const filtered = candidates.filter(c => {
    const matchesPath = c.path.includes(pathOnly);
    const matchesKind = !kindFilter || c.kind === kindFilter;
    return matchesPath && matchesKind;
  });

  if (filtered.length === 1) {
    return filtered[0];
  }

  if (filtered.length === 0) {
    const msg = kindFilter
      ? `Path hint "${pathHint}" with kind "${kindFilter}" didn't match any of the ${candidates.length} definitions.`
      : `Path hint "${pathHint}" didn't match any of the ${candidates.length} definitions.`;
    throw new AmbiguousSymbolError(symbolName, candidates, pathHint, msg);
  }

  // Still ambiguous - suggest using kind suffix if multiple kinds exist
  if (!kindFilter && filtered.length > 1) {
    const kinds = [...new Set(filtered.map(c => c.kind))];
    if (kinds.length > 1) {
      const suggestions = filtered.map(d => `{@${pathOnly}/${d.kind}#${symbolName}}  // ${d.kind} at line ${d.line}`).join('\n  - ');
      throw new AmbiguousSymbolError(
        symbolName,
        filtered,
        pathHint,
        `Symbol "${symbolName}" with hint "${pathHint}" is still ambiguous (${filtered.length} matches with different kinds).\n\n` +
        `Add a kind suffix to disambiguate:\n  - ${suggestions}`
      );
    }
  }

  throw new AmbiguousSymbolError(symbolName, filtered, pathHint);
}

function parseReference(reference: string): [string | null, string] {
  const parts = reference.split('#');
  if (parts.length === 1) {
    return [null, reference];
  }
  return [parts[0], parts[1]];
}

function findSimilarSymbols(
  input: string,
  symbolMap: SymbolMap,
  threshold = 3
): string[] {
  return Object.keys(symbolMap)
    .filter(name => levenshteinDistance(input, name) <= threshold)
    .slice(0, 5);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export class AmbiguousSymbolError extends Error {
  constructor(
    symbolName: string,
    candidates: SymbolDefinition[] | string[],
    pathHint?: string,
    customMessage?: string
  ) {
    if (typeof candidates[0] === 'string') {
      super(
        `Symbol "${symbolName}" not found.\n\n` +
        `Did you mean one of these?\n` +
        `${candidates.map(c => `  - {@${c}}`).join('\n')}`
      );
    } else if (customMessage) {
      super(customMessage);
    } else if (!pathHint) {
      const defs = candidates as SymbolDefinition[];
      const minimalPaths = findMinimalPaths(defs);
      super(
        `Symbol "${symbolName}" is ambiguous (${defs.length} matches).\n\n` +
        `Use a path hint to disambiguate:\n` +
        `${defs.map((d, i) => `  - {@${minimalPaths[i]}#${symbolName}}  // ${d.path}`).join('\n')}`
      );
    } else {
      const defs = candidates as SymbolDefinition[];
      super(
        `Symbol "${symbolName}" with hint "${pathHint}" is still ambiguous (${defs.length} matches).\n\n` +
        `Matching paths:\n` +
        `${defs.map(d => `  - ${d.path}:${d.line}`).join('\n')}`
      );
    }
    this.name = 'AmbiguousSymbolError';
  }
}

function findMinimalPaths(candidates: SymbolDefinition[]): string[] {
  const paths = candidates.map(c => c.path);
  const segments = paths.map(p => p.split('/'));

  return segments.map((seg, idx) => {
    let pathSegment = seg[seg.length - 1];
    for (let i = seg.length - 2; i >= 0; i--) {
      const candidate = seg.slice(i).join('/');
      if (paths.filter(p => p.includes(candidate)).length === 1) {
        return candidate.replace(/\.ts$/, '');
      }
    }
    return seg.slice(-2).join('/').replace(/\.ts$/, '');
  });
}
