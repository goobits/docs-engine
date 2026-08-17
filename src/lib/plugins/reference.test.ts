import { describe, expect, it, vi } from 'vitest';
import type { Html, Link, Paragraph, Root, Text } from 'mdast';
import type { ContainerDirective } from '../mdastTypes.ts';
import type { ApiSymbolMap } from '../utils/symbol-resolver.ts';
import type { ApiRepositoryConfig, RenderOptions } from '../utils/symbol-renderer.ts';
import { renderBlock, renderInline, symbolToSourceUrl } from '../utils/symbol-renderer.ts';
import { referencePlugin } from './reference.ts';

const repository: ApiRepositoryConfig = {
  url: 'https://github.com/acme/widgets',
  branch: 'main',
  sourceRoot: 'packages/widgets',
};

const symbols: ApiSymbolMap = {
  createWidget: [
    {
      name: 'createWidget',
      kind: 'function',
      signature: 'function createWidget(options: WidgetOptions): Widget',
      path: 'src/createWidget.ts',
      line: 42,
      exported: true,
      jsDoc: {
        description: 'Creates a **widget** from `options`.',
        params: [{ name: 'options', type: 'WidgetOptions', description: 'Widget options' }],
        returns: 'A configured widget',
        example: 'const widget = createWidget({ color: "blue" });',
      },
    },
  ],
  WidgetOptions: [
    {
      name: 'WidgetOptions',
      kind: 'interface',
      signature: 'interface WidgetOptions extends BaseOptions',
      path: 'src/types.ts',
      line: 8,
      exported: true,
      extends: ['BaseOptions'],
    },
  ],
};

function paragraphRoot(value: string): Root {
  return {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value }] }],
  };
}

function referenceBlockRoot(name: string, attributes?: Record<string, string>): Root {
  const directive: ContainerDirective = {
    type: 'containerDirective',
    name: 'reference',
    attributes,
    children: [{ type: 'paragraph', children: [{ type: 'text', value: name }] }],
  };
  return { type: 'root', children: [directive] };
}

describe('referencePlugin', () => {
  it('resolves inline references from the injected symbol map', () => {
    const tree = paragraphRoot('Use {@createWidget} with {@WidgetOptions}.');

    referencePlugin({ symbols, repository })(tree);

    const children = (tree.children[0] as Paragraph).children;
    expect(children).toHaveLength(5);
    expect(((children[1] as Link).children[0] as Text).value).toBe('createWidget');
    expect((children[1] as Link).url).toBe(
      'https://github.com/acme/widgets/blob/main/packages/widgets/src/createWidget.ts#L42'
    );
    expect(((children[3] as Link).children[0] as Text).value).toBe('WidgetOptions');
  });

  it('leaves ordinary text untouched', () => {
    const tree = paragraphRoot('Nothing to resolve.');

    referencePlugin({ symbols, repository })(tree);

    expect((tree.children[0] as Paragraph).children).toEqual([
      { type: 'text', value: 'Nothing to resolve.' },
    ]);
  });

  it('renders an escaped warning for an unresolved inline reference', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = paragraphRoot('Use {@<missing>}.');

    referencePlugin({ symbols, repository })(tree);

    const warning = (tree.children[0] as Paragraph).children[1] as Html;
    expect(warning.value).toContain('&lt;missing&gt;');
    expect(warning.value).not.toContain('{@<missing>}');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('renders reference blocks with requested sections', () => {
    const tree = referenceBlockRoot('createWidget', { show: 'signature,description' });

    referencePlugin({ symbols, repository })(tree);

    const html = (tree.children[0] as Html).value;
    expect(html).toContain('symbol-doc__signature');
    expect(html).toContain('symbol-doc__description');
    expect(html).not.toContain('symbol-doc__params');
    expect(html).toContain('packages/widgets/src/createWidget.ts#L42');
  });

  it('requires a symbol name in reference blocks', () => {
    const tree = referenceBlockRoot('');

    expect(() => referencePlugin({ symbols, repository })(tree)).toThrow(
      ':::reference directive requires a symbol name'
    );
  });
});

describe('API symbol rendering', () => {
  it('uses only the repository config supplied by the caller', () => {
    expect(symbolToSourceUrl(symbols.createWidget[0], repository)).toBe(
      'https://github.com/acme/widgets/blob/main/packages/widgets/src/createWidget.ts#L42'
    );
    expect(renderInline(symbols.createWidget[0], repository)).toContain(
      'https://github.com/acme/widgets/blob/main/packages/widgets/src/createWidget.ts#L42'
    );
  });

  it('renders block sections and hierarchy without process-global configuration', () => {
    const options: RenderOptions = { show: ['signature'] };
    const html = renderBlock(symbols.WidgetOptions[0], repository, options);

    expect(html).toContain('BaseOptions <|-- WidgetOptions');
    expect(html).toContain('symbol-doc__signature');
    expect(html).not.toContain('symbol-doc__description');
  });
});
