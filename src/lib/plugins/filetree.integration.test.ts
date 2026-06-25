/**
 * Real-fixture integration test for the filetree remark plugin.
 *
 * Unlike `filetree.test.ts` (which mocks `parseTree` / `encodeJsonBase64`),
 * this suite exercises the plugin together with its REAL collaborators:
 *   - `../utils/tree-parser.ts` (parseTree)
 *   - `../utils/base64.ts`     (encodeJsonBase64 / decodeJsonBase64)
 *
 * The goal is an end-to-end round trip: feed an mdast `code` node with a
 * realistic ASCII file tree through the plugin, then decode the embedded
 * base64 JSON back into the structured tree and assert it matches what the
 * real parser produces (directories / files / nesting / paths).
 *
 * No mocks, no snapshots, no network.
 */
import { describe, it, expect } from 'vitest';
import type { Root, Code, Html } from 'mdast';
import { filetreePlugin } from './filetree.ts';
import { parseTree, type TreeNode } from '../utils/tree-parser.ts';
import { decodeJsonBase64 } from '../utils/base64.ts';

/** Build a minimal mdast Root wrapping a single code block. */
function codeRoot(lang: string | null, value: string): Root {
  const code: Code = { type: 'code', lang, value };
  return { type: 'root', children: [code] };
}

/**
 * Extract the base64 payload from the plugin's `data-tree="..."` attribute and
 * decode it back into a TreeNode array using the REAL base64 decoder.
 */
function decodeEmbeddedTree(html: string): TreeNode[] {
  const match = html.match(/data-tree="([^"]*)"/);
  expect(match, `expected a data-tree attribute in: ${html}`).not.toBeNull();
  return decodeJsonBase64<TreeNode[]>(match![1]);
}

describe('filetree plugin (integration, real collaborators)', () => {
  it('round-trips a nested ASCII tree: HTML wrapper + decodable base64 payload', () => {
    // A connector-rooted tree so the parser nests correctly (see the
    // "bare root line" edge case below for the documented quirk).
    const body = [
      '├── src/',
      '│   ├── lib/',
      '│   │   └── utils.ts',
      '│   └── main.ts',
      '└── README.md',
    ].join('\n');

    const tree = codeRoot('filetree', body);
    filetreePlugin()(tree);

    // The code node is mutated in place into an html node.
    const node = tree.children[0] as unknown as Html;
    expect(node.type).toBe('html');
    expect(node.value).toContain('<div class="md-filetree"');
    expect(node.value).toContain('data-tree="');
    expect(node.value.endsWith('></div>')).toBe(true);
    // Success path must NOT emit the error markup.
    expect(node.value).not.toContain('md-filetree--error');

    // Decode the embedded payload and compare to the real parser output.
    const decoded = decodeEmbeddedTree(node.value);
    const expected = parseTree(body);
    expect(decoded).toEqual(expected);

    // Spell out the structural expectations (directories / files / nesting),
    // independent of parseTree, so the round trip is meaningfully pinned.
    expect(decoded).toHaveLength(2);

    const [src, readme] = decoded;

    expect(src).toMatchObject({ name: 'src', type: 'folder', path: 'src', depth: 0 });
    expect(src.children).toHaveLength(2);

    const lib = src.children![0];
    expect(lib).toMatchObject({ name: 'lib', type: 'folder', path: 'src/lib', depth: 1 });
    expect(lib.children).toHaveLength(1);
    expect(lib.children![0]).toMatchObject({
      name: 'utils.ts',
      type: 'file',
      extension: '.ts',
      path: 'src/lib/utils.ts',
      depth: 2,
    });

    const mainTs = src.children![1];
    expect(mainTs).toMatchObject({
      name: 'main.ts',
      type: 'file',
      extension: '.ts',
      path: 'src/main.ts',
      depth: 1,
    });
    // Files carry no children key.
    expect(mainTs.children).toBeUndefined();

    expect(readme).toMatchObject({
      name: 'README.md',
      type: 'file',
      extension: '.md',
      path: 'README.md',
      depth: 0,
    });
  });

  it('preserves a recognizable filename (package.json) through the round trip', () => {
    const body = ['├── package.json', '└── tsconfig.json'].join('\n');

    const tree = codeRoot('filetree', body);
    filetreePlugin()(tree);

    const node = tree.children[0] as unknown as Html;
    const decoded = decodeEmbeddedTree(node.value);

    expect(decoded.map((n) => n.name)).toEqual(['package.json', 'tsconfig.json']);
    expect(decoded.every((n) => n.type === 'file')).toBe(true);
    // Extension extraction is the literal last dotted segment.
    expect(decoded[0].extension).toBe('.json');
  });

  it('handles an empty tree body via the success path (encodes an empty array)', () => {
    // parseTree('') returns [] and encodeJsonBase64 does not throw, so the
    // plugin takes the SUCCESS path (not the error/callout path).
    const tree = codeRoot('filetree', '');
    filetreePlugin()(tree);

    const node = tree.children[0] as unknown as Html;
    expect(node.type).toBe('html');
    expect(node.value).toContain('<div class="md-filetree"');
    expect(node.value).not.toContain('md-filetree--error');

    const decoded = decodeEmbeddedTree(node.value);
    expect(decoded).toEqual([]);
  });

  it('leaves a non-filetree code block completely untouched', () => {
    const original = 'console.log("hi");';
    const tree = codeRoot('javascript', original);
    filetreePlugin()(tree);

    const node = tree.children[0] as unknown as Code;
    expect(node.type).toBe('code');
    expect(node.lang).toBe('javascript');
    expect(node.value).toBe(original);
  });

  it('documents ACTUAL behavior: a bare (connector-less) root line does not nest its children', () => {
    // The first line "src/" has no tree connector, so its children written
    // with connectors compute depth 0 and become SIBLINGS rather than nested
    // descendants. This is a parser quirk; the test pins the real behavior
    // rather than the visually-intended nesting.
    const body = ['src/', '├── index.ts', '└── app.ts'].join('\n');

    const tree = codeRoot('filetree', body);
    filetreePlugin()(tree);

    const node = tree.children[0] as unknown as Html;
    const decoded = decodeEmbeddedTree(node.value);

    // Round trip still equals what the real parser produced.
    expect(decoded).toEqual(parseTree(body));

    // Three top-level siblings, all at depth 0 (NOT index.ts/app.ts under src/).
    expect(decoded).toHaveLength(3);
    expect(decoded.map((n) => n.name)).toEqual(['src', 'index.ts', 'app.ts']);
    expect(decoded.every((n) => n.depth === 0)).toBe(true);

    // The src folder ends up with no children because of the quirk.
    expect(decoded[0]).toMatchObject({ name: 'src', type: 'folder' });
    expect(decoded[0].children).toEqual([]);
  });
});
