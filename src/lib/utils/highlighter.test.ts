import { describe, expect, it } from 'vitest';
import { getHighlighter, highlightCode } from './highlighter.ts';

describe('client highlighter', () => {
  it('loads supported languages on demand', async () => {
    const html = await highlightCode('const answer: number = 42;', 'typescript');

    expect(html).toContain('class="shiki');
    expect(html).toContain('answer');
  });

  it('caches a separate highlighter for each theme', async () => {
    const [dracula, nord] = await Promise.all([getHighlighter('dracula'), getHighlighter('nord')]);

    expect(dracula).not.toBe(nord);
  });
});
