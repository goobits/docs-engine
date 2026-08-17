import { describe, expect, it } from 'vitest';
import type { ApiSymbolMap } from '@goobits/docs-engine/reference';
import { renderApiReference } from './referenceOutput.ts';

describe('renderApiReference', () => {
  it('sorts symbols and renders caller-owned repository links', () => {
    const symbols: ApiSymbolMap = {
      Zebra: [
        {
          name: 'Zebra',
          path: 'src/zebra.ts',
          line: 9,
          kind: 'class',
          exported: true,
          signature: 'class Zebra',
        },
      ],
      alpha: [
        {
          name: 'alpha',
          path: 'src/alpha.ts',
          line: 2,
          kind: 'function',
          exported: true,
          signature: 'function alpha(): void',
          jsDoc: { description: 'Runs alpha.' },
        },
      ],
    };

    const markdown = renderApiReference(symbols, {
      title: 'Widget API',
      repository: {
        url: 'https://github.com/acme/widgets',
        branch: 'stable',
      },
    });

    expect(markdown).toContain('# Widget API');
    expect(markdown.indexOf('## src/alpha.ts')).toBeLessThan(markdown.indexOf('## src/zebra.ts'));
    expect(markdown).toContain('Runs alpha.');
    expect(markdown).toContain('https://github.com/acme/widgets/blob/stable/src/alpha.ts#L2');
  });

  it('renders an explicit empty state', () => {
    expect(renderApiReference({})).toContain('_No public API symbols were found._');
  });
});
