import type { ApiSymbol, ApiSymbolMap } from './symbolTypes.ts';

export type { ApiSymbol, ApiSymbolMap } from './symbolTypes.ts';

/**
 * Resolve a symbol reference to its definition
 *
 * Supports two reference formats:
 * - Simple: `SymbolName` - works when symbol is unique
 * - Qualified: `path/hint#SymbolName` - disambiguates when multiple symbols share a name
 *
 * Kind suffixes can be added to path hints for further disambiguation:
 * - `path/hint/type#SymbolName` - match only type aliases
 * - `path/hint/const#SymbolName` - match only constants
 *
 * @param reference - Symbol reference string (e.g., 'MyType' or 'utils/types#MyType')
 * @param symbolMap - The loaded symbol map to search
 * @returns The resolved symbol definition
 * @throws {AmbiguousSymbolError} When symbol is not found or multiple matches exist
 *
 * @example
 * ```typescript
 * // Simple reference (when unique)
 * const symbol = resolveSymbol('RequestState', symbolMap);
 *
 * // Qualified reference (when ambiguous)
 * const symbol = resolveSymbol('types/enums#Status', symbolMap);
 * ```
 *
 * @public
 */
export function resolveSymbol(reference: string, symbolMap: ApiSymbolMap): ApiSymbol {
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
  const filtered = candidates.filter((c) => {
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
    const kinds = [...new Set(filtered.map((c) => c.kind))];
    if (kinds.length > 1) {
      const suggestions = filtered
        .map((d) => `{@${pathOnly}/${d.kind}#${symbolName}}  // ${d.kind} at line ${d.line}`)
        .join('\n  - ');
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

function findSimilarSymbols(input: string, symbolMap: ApiSymbolMap, threshold = 3): string[] {
  return Object.keys(symbolMap)
    .filter((name) => levenshteinDistance(input, name) <= threshold)
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

/**
 * Error thrown when symbol resolution fails or is ambiguous
 *
 * Provides helpful error messages with:
 * - Suggestions for similar symbol names (typo detection)
 * - Instructions for disambiguating with path hints
 * - Kind suffix suggestions when multiple kinds share a name
 *
 * @public
 */
export class AmbiguousSymbolError extends Error {
  constructor(
    symbolName: string,
    candidates: ApiSymbol[] | string[],
    pathHint?: string,
    customMessage?: string
  ) {
    if (typeof candidates[0] === 'string') {
      super(
        `Symbol "${symbolName}" not found.\n\n` +
          `Did you mean one of these?\n` +
          `${candidates.map((c) => `  - {@${c}}`).join('\n')}`
      );
    } else if (customMessage) {
      super(customMessage);
    } else if (!pathHint) {
      const defs = candidates as ApiSymbol[];
      const minimalPaths = findMinimalPaths(defs);
      super(
        `Symbol "${symbolName}" is ambiguous (${defs.length} matches).\n\n` +
          `Use a path hint to disambiguate:\n` +
          `${defs.map((d, i) => `  - {@${minimalPaths[i]}#${symbolName}}  // ${d.path}`).join('\n')}`
      );
    } else {
      const defs = candidates as ApiSymbol[];
      super(
        `Symbol "${symbolName}" with hint "${pathHint}" is still ambiguous (${defs.length} matches).\n\n` +
          `Matching paths:\n` +
          `${defs.map((d) => `  - ${d.path}:${d.line}`).join('\n')}`
      );
    }
    this.name = 'AmbiguousSymbolError';
  }
}

function findMinimalPaths(candidates: ApiSymbol[]): string[] {
  const paths = candidates.map((c) => c.path);
  const segments = paths.map((p) => p.split('/'));

  return segments.map((seg, _idx) => {
    for (let i = seg.length - 2; i >= 0; i--) {
      const candidate = seg.slice(i).join('/');
      if (paths.filter((p) => p.includes(candidate)).length === 1) {
        return candidate.replace(/\.ts$/, '');
      }
    }
    return seg.slice(-2).join('/').replace(/\.ts$/, '');
  });
}
