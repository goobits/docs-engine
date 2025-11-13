import type { SymbolDefinition } from './symbol-resolver';

/**
 * Generate Mermaid class diagram showing type hierarchy
 */
function generateHierarchyDiagram(symbol: SymbolDefinition): string | null {
  // Only generate for types/interfaces/classes with inheritance
  if (!symbol.extends && !symbol.implements) {
    return null;
  }

  const lines: string[] = ['classDiagram'];

  // Add parent relationships (extends)
  if (symbol.extends) {
    symbol.extends.forEach((parent) => {
      lines.push(`  ${parent} <|-- ${symbol.name}`);
    });
  }

  // Add interface relationships (implements)
  if (symbol.implements) {
    symbol.implements.forEach((iface) => {
      lines.push(`  ${iface} <|.. ${symbol.name}`);
    });
  }

  // Add class type annotations
  if (symbol.kind === 'interface') {
    lines.push(`  class ${symbol.name} {`);
    lines.push(`    <<interface>>`);
    lines.push(`  }`);
  } else if (symbol.kind === 'class') {
    lines.push(`  class ${symbol.name}`);
  }

  // Add parent type annotations if they're interfaces
  if (symbol.extends) {
    symbol.extends.forEach((parent) => {
      lines.push(`  class ${parent} {`);
      lines.push(`    <<interface>>`);
      lines.push(`  }`);
    });
  }

  if (symbol.implements) {
    symbol.implements.forEach((iface) => {
      lines.push(`  class ${iface} {`);
      lines.push(`    <<interface>>`);
      lines.push(`  }`);
    });
  }

  return lines.join('\n');
}

/**
 * Render inline symbol reference as a link with tooltip
 */
export function renderInline(symbol: SymbolDefinition): string {
  // Link directly to GitHub source since we don't have per-symbol doc pages
  const githubUrl = symbolToGitHubUrl(symbol);

  // Use JSDoc description for tooltip if available, fallback to signature
  const tooltip = symbol.jsDoc?.description
    ? escapeHtml(symbol.jsDoc.description.split('\n')[0]) // First line of description
    : escapeHtml(symbol.signature);

  return `<a href="${githubUrl}" class="symbol symbol--${symbol.kind}" title="${tooltip}" target="_blank" rel="noopener">${escapeHtml(symbol.name)}</a>`;
}

/**
 * Get smart default options based on symbol kind
 */
function getDefaultOptions(kind: string): RenderOptions {
  switch (kind) {
    case 'function':
    case 'method':
      // Functions: show everything (signature, description, params, returns, example)
      return { show: ['signature', 'description', 'params', 'returns', 'example'] };

    case 'interface':
    case 'type':
      // Types: show signature and description, skip params/returns
      return { show: ['signature', 'description', 'example'] };

    case 'class':
      // Classes: show signature, description, and example
      return { show: ['signature', 'description', 'example'] };

    case 'enum':
      // Enums: show signature and description
      return { show: ['signature', 'description'] };

    case 'variable':
    case 'constant':
      // Variables: show signature and description
      return { show: ['signature', 'description', 'example'] };

    default:
      // Default: show everything
      return { show: ['signature', 'description', 'params', 'returns', 'example'] };
  }
}

/**
 * Check if a section should be shown based on options
 */
function shouldShow(
  section: 'signature' | 'description' | 'params' | 'returns' | 'example',
  options: RenderOptions
): boolean {
  return options.show?.includes(section) !== false;
}

/**
 * Render block symbol reference as full API documentation
 */
export function renderBlock(symbol: SymbolDefinition, options?: RenderOptions): string {
  // Apply smart defaults based on symbol kind if no explicit options provided
  const effectiveOptions = options || getDefaultOptions(symbol.kind);

  const sections: string[] = [];

  sections.push(`
    <div class="symbol-doc__header">
      <span class="symbol-doc__kind">${escapeHtml(symbol.kind)}</span>
      <code class="symbol-doc__name">${escapeHtml(symbol.name)}</code>
    </div>
  `);

  if (shouldShow('signature', effectiveOptions)) {
    sections.push(`
      <div class="symbol-doc__signature">
        <pre><code class="language-typescript">${escapeHtml(symbol.signature)}</code></pre>
      </div>
    `);
  }

  // Show type hierarchy diagram if available
  const hierarchyDiagram = generateHierarchyDiagram(symbol);
  if (hierarchyDiagram) {
    sections.push(`
      <div class="symbol-doc__hierarchy">
        <h4>Type Hierarchy</h4>
        <pre class="mermaid">${hierarchyDiagram}</pre>
      </div>
    `);
  }

  if (symbol.jsDoc?.description && shouldShow('description', effectiveOptions)) {
    sections.push(`
      <div class="symbol-doc__description">
        ${markdownToHtml(symbol.jsDoc.description)}
      </div>
    `);
  }

  // Show examples prominently (before params/returns for better visibility)
  if (symbol.jsDoc?.example && shouldShow('example', effectiveOptions)) {
    sections.push(`
      <div class="symbol-doc__example">
        <h4>Example</h4>
        <pre><code class="language-typescript">${escapeHtml(symbol.jsDoc.example)}</code></pre>
      </div>
    `);
  }

  if (symbol.jsDoc?.params && shouldShow('params', effectiveOptions)) {
    sections.push(renderParams(symbol.jsDoc.params));
  }

  if (symbol.jsDoc?.returns && shouldShow('returns', effectiveOptions)) {
    sections.push(`
      <div class="symbol-doc__returns">
        <h4>Returns</h4>
        <p>${escapeHtml(symbol.jsDoc.returns)}</p>
      </div>
    `);
  }

  // Show related symbols (from type references and @see tags)
  const relatedSymbols = [...(symbol.related || []), ...(symbol.jsDoc?.see || [])];

  if (relatedSymbols.length > 0) {
    const uniqueRelated = [...new Set(relatedSymbols)];
    const relatedLinks = uniqueRelated
      .map((name) => {
        // Check if it's a URL (from @see tags)
        if (name.startsWith('http://') || name.startsWith('https://')) {
          return `<a href="${escapeHtml(name)}" target="_blank" rel="noopener">${escapeHtml(name)}</a>`;
        }
        // Otherwise treat as symbol reference
        return `{@${escapeHtml(name)}}`;
      })
      .join(', ');

    sections.push(`
      <div class="symbol-doc__related">
        <h4>See also</h4>
        <p>${relatedLinks}</p>
      </div>
    `);
  }

  sections.push(`
    <div class="symbol-doc__source">
      <a href="${symbolToGitHubUrl(symbol)}" target="_blank" rel="noopener">View source</a>
    </div>
  `);

  return `<div class="symbol-doc">${sections.join('\n')}</div>`;
}

export interface RenderOptions {
  show?: Array<'signature' | 'description' | 'params' | 'returns' | 'example'>;
}

function renderParams(params: Array<{ name: string; description: string; type: string }>): string {
  const rows = params
    .map(
      (p) => `
    <tr>
      <td><code>${escapeHtml(p.name)}</code></td>
      <td><code>${escapeHtml(p.type)}</code></td>
      <td>${escapeHtml(p.description)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <div class="symbol-doc__params">
      <h4>Parameters</h4>
      <table>
        <thead>
          <tr><th>Name</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/*
function _symbolToDocUrl(symbol: SymbolDefinition): string {
  const relativePath = symbol.path
    .replace(/^src\/lib\/server\//, '')
    .replace(/^\.\.\/packages\/shared\/src\//, 'shared/');

  return `/docs/api/${relativePath.replace(/\.ts$/, '')}#${symbol.name}`;
}
*/

export function symbolToGitHubUrl(symbol: SymbolDefinition): string {
  const repoPath = symbol.path.startsWith('../')
    ? symbol.path.replace(/^\.\.\//, '')
    : `web/${symbol.path}`;

  return `https://github.com/goobits/spacebase/blob/main/${repoPath}#L${symbol.line}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, ' ')}</p>`)
    .join('\n');
}
