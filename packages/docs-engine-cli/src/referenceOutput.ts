import {
  symbolToSourceUrl,
  type ApiRepositoryConfig,
  type ApiSymbol,
  type ApiSymbolMap,
} from '@goobits/docs-engine/reference';

export interface ApiReferenceOptions {
  title?: string;
  repository?: ApiRepositoryConfig;
}

/** Render a deterministic Markdown reference from the canonical API symbol map. */
export function renderApiReference(
  symbolMap: ApiSymbolMap,
  options: ApiReferenceOptions = {}
): string {
  const symbols = Object.values(symbolMap).flat().sort(compareSymbols);
  const sections = new Map<string, ApiSymbol[]>();

  for (const symbol of symbols) {
    const existing = sections.get(symbol.path);
    if (existing) existing.push(symbol);
    else sections.set(symbol.path, [symbol]);
  }

  const output = [`# ${options.title ?? 'API Reference'}`, ''];
  if (symbols.length === 0) {
    output.push('_No public API symbols were found._', '');
    return `${output.join('\n')}\n`;
  }

  output.push(
    `Generated from ${sections.size} source file(s) and ${symbols.length} public symbol(s).`,
    ''
  );

  for (const [sourcePath, sourceSymbols] of sections) {
    output.push(`## ${sourcePath}`, '');
    for (const symbol of sourceSymbols) {
      output.push(
        `### ${symbol.name}`,
        '',
        `\`${symbol.kind}\``,
        '',
        '```ts',
        symbol.signature,
        '```',
        ''
      );
      if (symbol.jsDoc?.description) output.push(symbol.jsDoc.description, '');
      if (options.repository) {
        output.push(`[View source](${symbolToSourceUrl(symbol, options.repository)})`, '');
      }
    }
  }

  return `${output.join('\n')}\n`;
}

function compareSymbols(left: ApiSymbol, right: ApiSymbol): number {
  return (
    left.path.localeCompare(right.path) ||
    left.line - right.line ||
    left.name.localeCompare(right.name)
  );
}
