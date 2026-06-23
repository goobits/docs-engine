/**
 * Real-fixture integration test for the `reference` remark plugin.
 *
 * Unlike `reference.test.ts` (which mocks `resolveSymbol` / `renderBlock` /
 * `symbolToGitHubUrl`), this suite exercises the plugin together with its REAL
 * collaborators:
 *   - `../utils/symbol-resolver.ts` (resolveSymbol)
 *   - `../utils/symbol-renderer.ts` (renderBlock / renderInline / symbolToGitHubUrl)
 *
 * The renderer and resolver are NEVER mocked here. The only seam we touch is the
 * plugin's data source: `referencePlugin()` has no options API and instead lazily
 * calls `loadSymbolMap()`, which reads a generated JSON file from disk and caches
 * it process-wide. Because a real `docs/.generated/symbol-map.json` already exists
 * in this repo (and the hard constraints forbid editing/overwriting source files),
 * we inject our own *real* fixture symbol map by stubbing only that disk loader.
 * Stubbing the loader is the documented fallback for "the plugin loads the symbol
 * map from disk (not via options)" — it provides fixture data while leaving the
 * resolver + renderer fully real.
 *
 * Assertions are made against the ACTUAL HTML the real renderer produces (anchors,
 * GitHub source URLs, signatures, params table, Mermaid hierarchy). No snapshots,
 * no network.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Root, Paragraph, Link, Text, Html } from 'mdast';
import type { ContainerDirective } from '../mdast.d.ts';
import { referencePlugin } from './reference.js';
import * as symbolResolver from '../utils/symbol-resolver.js';
import {
  renderBlock,
  renderInline,
  symbolToGitHubUrl,
  type RenderOptions,
} from '../utils/symbol-renderer.js';

// ---------------------------------------------------------------------------
// Real fixture symbol map
//
// Minimal but realistic, matching the SymbolMap / SymbolDefinition shape that
// the resolver and renderer expect (name, kind, path, line, signature, jsDoc,
// params, extends/implements, related, etc.). Used verbatim by the REAL
// resolveSymbol + renderer — nothing here is mocked.
// ---------------------------------------------------------------------------
const fixtureSymbolMap: symbolResolver.SymbolMap = {
  // Function with full JSDoc: signature + description (markdown) + params +
  // returns + example. Exercises the renderer's params table and markdownToHtml.
  createServer: [
    {
      name: 'createServer',
      kind: 'function',
      path: 'src/lib/server.ts',
      line: 42,
      exported: true,
      signature: 'function createServer(options: ServerOptions): Server',
      jsDoc: {
        description: 'Creates a **server** instance configured with `options`.',
        params: [{ name: 'options', type: 'ServerOptions', description: 'Server configuration' }],
        returns: 'A configured Server instance',
        example: 'const server = createServer({ port: 3000 });',
      },
      related: ['ServerOptions'],
    },
  ],

  // Interface that `extends` a base type. Exercises the Mermaid type-hierarchy
  // diagram branch (generateHierarchyDiagram) inside renderBlock.
  ServerOptions: [
    {
      name: 'ServerOptions',
      kind: 'interface',
      path: 'src/lib/types.ts',
      line: 7,
      exported: true,
      signature: 'interface ServerOptions extends BaseOptions {\n  port: number;\n}',
      extends: ['BaseOptions'],
    },
  ],

  // Type with NO jsDoc — inline tooltip must fall back to the raw signature.
  ApiResult: [
    {
      name: 'ApiResult',
      kind: 'type',
      path: 'src/lib/api.ts',
      line: 15,
      exported: true,
      signature: 'type ApiResult = { ok: boolean }',
    },
  ],

  // Symbol whose path begins with '../' to exercise the *other* branch of
  // symbolToGitHubUrl (strip leading '../', do NOT prepend 'web/').
  SharedConfig: [
    {
      name: 'SharedConfig',
      kind: 'const',
      path: '../shared/config.ts',
      line: 3,
      exported: true,
      signature: 'const SharedConfig: Readonly<{ env: string }>',
    },
  ],
};

/** Build a minimal mdast Root wrapping a single paragraph of text. */
function paragraphRoot(text: string): Root {
  return {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
  };
}

/** Build a minimal mdast Root wrapping a `:::reference` container directive. */
function referenceBlockRoot(symbolName: string, attributes?: Record<string, string>): Root {
  const directive: ContainerDirective = {
    type: 'containerDirective',
    name: 'reference',
    attributes,
    children: [{ type: 'paragraph', children: [{ type: 'text', value: symbolName }] }],
  };
  return { type: 'root', children: [directive] };
}

describe('reference plugin (integration, real resolver + renderer)', () => {
  beforeEach(() => {
    // Inject the REAL fixture map as the plugin's data source. This is the only
    // stub in the suite; resolveSymbol/renderBlock/symbolToGitHubUrl stay real.
    vi.spyOn(symbolResolver, 'loadSymbolMap').mockReturnValue(fixtureSymbolMap);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('inline {@Symbol} references (real symbolToGitHubUrl)', () => {
    it('resolves an inline reference into a real link node with a GitHub source URL', () => {
      const tree = paragraphRoot('See {@createServer} for setup.');

      referencePlugin()(tree);

      const paragraph = tree.children[0] as Paragraph;
      // text → link → text
      expect(paragraph.children).toHaveLength(3);
      expect((paragraph.children[0] as Text).value).toBe('See ');
      expect((paragraph.children[2] as Text).value).toBe(' for setup.');

      const link = paragraph.children[1] as Link;
      expect(link.type).toBe('link');
      // Link text is the symbol name.
      expect((link.children[0] as Text).value).toBe('createServer');

      // URL is produced by the REAL symbolToGitHubUrl: default repo config
      // (goobits/spacebase@main), a 'web/' prefix for non-'../' paths, and the
      // #L<line> anchor.
      expect(link.url).toBe(
        'https://github.com/goobits/spacebase/blob/main/web/src/lib/server.ts#L42'
      );
      // Matches the standalone renderer for the same symbol.
      expect(link.url).toBe(symbolToGitHubUrl(fixtureSymbolMap.createServer[0]));

      // rehype hint properties carry kind-specific classes + the real href.
      const hProps = (link.data as { hProperties: Record<string, unknown> }).hProperties;
      expect(hProps.href).toBe(link.url);
      expect(hProps.className).toEqual(['symbol', 'symbol--function']);
      expect(hProps.target).toBe('_blank');
      expect(hProps.rel).toBe('noopener');

      // Tooltip prefers the first line of the JSDoc description.
      expect(link.title).toBe('Creates a **server** instance configured with `options`.');
    });

    it('falls back to the raw signature for the tooltip when there is no JSDoc', () => {
      const tree = paragraphRoot('Returns an {@ApiResult}.');

      referencePlugin()(tree);

      const paragraph = tree.children[0] as Paragraph;
      const link = paragraph.children[1] as Link;
      expect(link.type).toBe('link');
      expect((link.children[0] as Text).value).toBe('ApiResult');
      expect(link.title).toBe('type ApiResult = { ok: boolean }');
      expect(link.url).toBe(
        'https://github.com/goobits/spacebase/blob/main/web/src/lib/api.ts#L15'
      );
      expect((link.data as { hProperties: { className: string[] } }).hProperties.className).toEqual(
        ['symbol', 'symbol--type']
      );
    });

    it('builds a non-web GitHub URL for symbols whose path starts with "../"', () => {
      const tree = paragraphRoot('Uses {@SharedConfig} at boot.');

      referencePlugin()(tree);

      const link = (tree.children[0] as Paragraph).children[1] as Link;
      // The '../' branch strips the leading '../' and does NOT prepend 'web/'.
      expect(link.url).toBe('https://github.com/goobits/spacebase/blob/main/shared/config.ts#L3');
      expect(link.url).toBe(symbolToGitHubUrl(fixtureSymbolMap.SharedConfig[0]));
    });

    it('resolves multiple inline references in a single text node', () => {
      const tree = paragraphRoot('Call {@createServer} with {@ServerOptions}.');

      referencePlugin()(tree);

      const paragraph = tree.children[0] as Paragraph;
      // text, link, text, link, text
      expect(paragraph.children).toHaveLength(5);
      expect(paragraph.children[1].type).toBe('link');
      expect(paragraph.children[3].type).toBe('link');
      expect(((paragraph.children[1] as Link).children[0] as Text).value).toBe('createServer');
      expect(((paragraph.children[3] as Link).children[0] as Text).value).toBe('ServerOptions');
    });
  });

  describe(':::reference blocks (real renderBlock)', () => {
    it('renders a full function documentation block (signature, description, params, returns, source)', () => {
      const tree = referenceBlockRoot('createServer');

      referencePlugin()(tree);

      const node = tree.children[0] as Html;
      expect(node.type).toBe('html');
      const html = node.value;

      // The block is exactly what the real renderer emits for this symbol.
      expect(html).toBe(renderBlock(fixtureSymbolMap.createServer[0]));

      // Header: kind + name.
      expect(html).toContain('<div class="symbol-doc">');
      expect(html).toContain('<span class="symbol-doc__kind">function</span>');
      expect(html).toContain('<code class="symbol-doc__name">createServer</code>');

      // Signature is rendered verbatim (HTML-escaped) in a typescript code block.
      expect(html).toContain('class="symbol-doc__signature"');
      expect(html).toContain('function createServer(options: ServerOptions): Server');

      // markdownToHtml converts the JSDoc description's markdown.
      expect(html).toContain('class="symbol-doc__description"');
      expect(html).toContain('<strong>server</strong>');
      expect(html).toContain('<code>options</code>');

      // Example block.
      expect(html).toContain('class="symbol-doc__example"');
      expect(html).toContain('const server = createServer({ port: 3000 });');

      // Params table with name / type / description cells.
      expect(html).toContain('class="symbol-doc__params"');
      expect(html).toContain('<td><code>options</code></td>');
      expect(html).toContain('<td><code>ServerOptions</code></td>');
      expect(html).toContain('Server configuration');

      // Returns section.
      expect(html).toContain('class="symbol-doc__returns"');
      expect(html).toContain('A configured Server instance');

      // Source link uses the real GitHub URL.
      expect(html).toContain('class="symbol-doc__source"');
      expect(html).toContain(
        '<a href="https://github.com/goobits/spacebase/blob/main/web/src/lib/server.ts#L42" target="_blank" rel="noopener">View source</a>'
      );
    });

    it('renders a Mermaid type-hierarchy diagram for an interface that extends a base type', () => {
      const tree = referenceBlockRoot('ServerOptions');

      referencePlugin()(tree);

      const html = (tree.children[0] as Html).value;
      expect(html).toBe(renderBlock(fixtureSymbolMap.ServerOptions[0]));

      expect(html).toContain('<span class="symbol-doc__kind">interface</span>');
      // generateHierarchyDiagram output, wrapped for the client-side Mermaid renderer.
      expect(html).toContain('class="symbol-doc__hierarchy"');
      expect(html).toContain('<pre class="mermaid">classDiagram');
      expect(html).toContain('BaseOptions <|-- ServerOptions');
      expect(html).toContain('<<interface>>');
    });

    it('honors the `show` attribute to restrict which sections render', () => {
      // Only the signature section requested → no params/returns/example/description.
      const tree = referenceBlockRoot('createServer', { show: 'signature' });

      referencePlugin()(tree);

      const html = (tree.children[0] as Html).value;
      const restricted: RenderOptions = { show: ['signature'] };
      expect(html).toBe(renderBlock(fixtureSymbolMap.createServer[0], restricted));

      expect(html).toContain('class="symbol-doc__signature"');
      expect(html).not.toContain('class="symbol-doc__params"');
      expect(html).not.toContain('class="symbol-doc__returns"');
      expect(html).not.toContain('class="symbol-doc__example"');
      expect(html).not.toContain('class="symbol-doc__description"');
      // Source link is always emitted regardless of `show`.
      expect(html).toContain('class="symbol-doc__source"');
    });
  });

  describe('direct renderer collaboration (no plugin, no mocks)', () => {
    it('renderInline produces an anchor whose href matches symbolToGitHubUrl', () => {
      const symbol = fixtureSymbolMap.createServer[0];
      const html = renderInline(symbol);
      const url = symbolToGitHubUrl(symbol);

      expect(url).toBe('https://github.com/goobits/spacebase/blob/main/web/src/lib/server.ts#L42');
      expect(html).toContain(`<a href="${url}"`);
      expect(html).toContain('class="symbol symbol--function"');
      expect(html).toContain('>createServer</a>');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener"');
    });

    it('renderInline escapes HTML in a symbol signature used as the tooltip', () => {
      // No jsDoc → tooltip falls back to the signature, which must be escaped.
      const symbol: symbolResolver.SymbolDefinition = {
        name: 'Handler',
        kind: 'type',
        path: 'src/lib/handler.ts',
        line: 1,
        exported: true,
        signature: 'type Handler = (req: Request) => Response<"a" & "b">',
      };
      const html = renderInline(symbol);
      expect(html).not.toContain('Response<"a"');
      expect(html).toContain('&lt;');
      expect(html).toContain('&quot;');
      expect(html).toContain('&amp;');
    });
  });

  describe('graceful handling of unresolved references (actual behavior)', () => {
    it('renders an inline warning span (not a thrown error) for an unknown {@Symbol}', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const tree = paragraphRoot('Check {@DoesNotExist} please.');

      // Per actual behavior the plugin swallows the resolver error inline.
      expect(() => referencePlugin()(tree)).not.toThrow();

      const paragraph = tree.children[0] as Paragraph;
      // text → warning html → text
      expect(paragraph.children).toHaveLength(3);
      const warning = paragraph.children[1] as Html;
      expect(warning.type).toBe('html');
      expect(warning.value).toContain('class="symbol-ref-error"');
      expect(warning.value).toContain('{@DoesNotExist}');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('renders a warning block (not a thrown error) for an unknown :::reference symbol', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const tree = referenceBlockRoot('NopeMissing');

      expect(() => referencePlugin()(tree)).not.toThrow();

      const node = tree.children[0] as Html;
      expect(node.type).toBe('html');
      expect(node.value).toContain('class="symbol-ref-block-error"');
      expect(node.value).toContain(':::reference NopeMissing');
      // The real AmbiguousSymbolError message is surfaced in the block. NOTE:
      // for an unknown symbol the error reads "is ambiguous (0 matches)" rather
      // than a "not found" message. This is ACTUAL behavior: resolveSymbol calls
      // `new AmbiguousSymbolError(name, findSimilarSymbols(...))`, but when there
      // are no similar names the candidates array is empty, so the constructor's
      // `typeof candidates[0] === 'string'` guard is false (candidates[0] is
      // undefined) and it falls through to the generic "ambiguous" branch. We
      // assert the real text and intentionally do NOT fix the source.
      expect(node.value).toContain('Symbol &quot;NopeMissing&quot; is ambiguous (0 matches)');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('leaves plain text without references untouched', () => {
      const tree = paragraphRoot('Just regular prose, nothing to resolve.');

      referencePlugin()(tree);

      const paragraph = tree.children[0] as Paragraph;
      expect(paragraph.children).toHaveLength(1);
      expect((paragraph.children[0] as Text).value).toBe('Just regular prose, nothing to resolve.');
    });
  });
});
