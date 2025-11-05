import { describe, it, expect } from 'vitest';
import {
	parseCodeMetadata,
	parseLineRange,
	applyDiffStyling,
	applyLineHighlighting,
	wrapWithMetadata,
	type CodeBlockMetadata
} from './code-highlight';

/**
 * Tests for code-highlight plugin utility functions
 *
 * These tests focus on the parsing and metadata extraction logic.
 * Full integration tests with Shiki would require more complex setup.
 */

describe('code-highlight plugin', () => {
	describe('parseCodeMetadata', () => {
		it('should parse language from info string', () => {
			const result = parseCodeMetadata('typescript');
			expect(result.language).toBe('typescript');
			expect(result.raw).toBe('typescript');
		});

		it('should default to plaintext for empty info string', () => {
			const result = parseCodeMetadata('');
			expect(result.language).toBe('plaintext');
		});

		it('should parse title attribute with double quotes', () => {
			const result = parseCodeMetadata('typescript title="app.ts"');
			expect(result.language).toBe('typescript');
			expect(result.title).toBe('app.ts');
		});

		it('should parse title attribute with single quotes', () => {
			const result = parseCodeMetadata("javascript title='index.js'");
			expect(result.language).toBe('javascript');
			expect(result.title).toBe('index.js');
		});

		it('should parse line highlighting range', () => {
			const result = parseCodeMetadata('typescript {1,3-5}');
			expect(result.language).toBe('typescript');
			expect(result.highlightLines).toEqual([1, 3, 4, 5]);
		});

		it('should detect showLineNumbers flag', () => {
			const result = parseCodeMetadata('typescript showLineNumbers');
			expect(result.showLineNumbers).toBe(true);
		});

		it('should detect diff language', () => {
			const result = parseCodeMetadata('diff');
			expect(result.language).toBe('diff');
			expect(result.isDiff).toBe(true);
		});

		it('should parse complex info string with all features', () => {
			const result = parseCodeMetadata('typescript title="app.ts" {1,3-5,10} showLineNumbers');
			expect(result.language).toBe('typescript');
			expect(result.title).toBe('app.ts');
			expect(result.highlightLines).toEqual([1, 3, 4, 5, 10]);
			expect(result.showLineNumbers).toBe(true);
			expect(result.isDiff).toBe(false);
		});
	});

	describe('parseLineRange', () => {
		it('should parse individual line numbers', () => {
			const result = parseLineRange('1,2,3');
			expect(result).toEqual([1, 2, 3]);
		});

		it('should parse line ranges', () => {
			const result = parseLineRange('1-5');
			expect(result).toEqual([1, 2, 3, 4, 5]);
		});

		it('should parse mixed ranges and individual lines', () => {
			const result = parseLineRange('1,3-5,10');
			expect(result).toEqual([1, 3, 4, 5, 10]);
		});

		it('should sort line numbers in ascending order', () => {
			const result = parseLineRange('5,1,3');
			expect(result).toEqual([1, 3, 5]);
		});

		it('should deduplicate line numbers', () => {
			const result = parseLineRange('1,1,2-4,3');
			expect(result).toEqual([1, 2, 3, 4]);
		});

		it('should handle complex range with multiple segments', () => {
			const result = parseLineRange('1-3,5,7-9,12');
			expect(result).toEqual([1, 2, 3, 5, 7, 8, 9, 12]);
		});
	});

	describe('applyDiffStyling', () => {
		it('should add diff-add class to lines starting with +', () => {
			const code = '+ added line\n  context';
			const html = '<span class="line">+ added line</span>\n<span class="line">  context</span>';
			const result = applyDiffStyling(code, html);
			expect(result).toContain('class="line diff-add"');
		});

		it('should add diff-remove class to lines starting with -', () => {
			const code = '- removed line\n  context';
			const html = '<span class="line">- removed line</span>\n<span class="line">  context</span>';
			const result = applyDiffStyling(code, html);
			expect(result).toContain('class="line diff-remove"');
		});

		it('should not modify context lines', () => {
			const code = '  context line';
			const html = '<span class="line">  context line</span>';
			const result = applyDiffStyling(code, html);
			expect(result).toBe(html);
		});

		it('should handle multiple diff lines', () => {
			const code = '+ added\n- removed\n  context';
			const html =
				'<span class="line">+ added</span>\n<span class="line">- removed</span>\n<span class="line">  context</span>';
			const result = applyDiffStyling(code, html);
			expect(result).toContain('diff-add');
			expect(result).toContain('diff-remove');
		});
	});

	describe('applyLineHighlighting', () => {
		it('should add highlight class to specified lines', () => {
			const html = '<span class="line">line 1</span>\n<span class="line">line 2</span>';
			const result = applyLineHighlighting(html, [1]);
			expect(result).toContain('class="line highlight"');
		});

		it('should not modify non-highlighted lines', () => {
			const html =
				'<span class="line">line 1</span>\n<span class="line">line 2</span>\n<span class="line">line 3</span>';
			const result = applyLineHighlighting(html, [2]);
			const lines = result.split('\n');
			expect(lines[0]).toContain('class="line"');
			expect(lines[0]).not.toContain('highlight');
			expect(lines[1]).toContain('class="line highlight"');
			expect(lines[2]).toContain('class="line"');
			expect(lines[2]).not.toContain('highlight');
		});

		it('should handle empty highlight array', () => {
			const html = '<span class="line">line 1</span>';
			const result = applyLineHighlighting(html, []);
			expect(result).toBe(html);
		});

		it('should highlight multiple lines', () => {
			const html =
				'<span class="line">1</span>\n<span class="line">2</span>\n<span class="line">3</span>\n<span class="line">4</span>';
			const result = applyLineHighlighting(html, [1, 3, 4]);
			const lines = result.split('\n');
			expect(lines[0]).toContain('highlight');
			expect(lines[1]).not.toContain('highlight');
			expect(lines[2]).toContain('highlight');
			expect(lines[3]).toContain('highlight');
		});
	});

	describe('wrapWithMetadata', () => {
		const mockHtml = '<pre class="shiki"><code>const x = 1;</code></pre>';
		const mockCode = 'const x = 1;';

		it('should wrap code with title when title is present', () => {
			const metadata: CodeBlockMetadata = {
				language: 'typescript',
				title: 'app.ts',
				raw: 'typescript title="app.ts"'
			};
			const result = wrapWithMetadata(mockHtml, metadata, mockCode);
			expect(result).toContain('code-block-container');
			expect(result).toContain('code-block-title');
			expect(result).toContain('app.ts');
		});

		it('should add line numbers when showLineNumbers is true', () => {
			const metadata: CodeBlockMetadata = {
				language: 'typescript',
				showLineNumbers: true,
				raw: 'typescript showLineNumbers'
			};
			const result = wrapWithMetadata(mockHtml, metadata, mockCode);
			expect(result).toContain('code-block-line-numbers');
			expect(result).toContain('line-number');
		});

		it('should not wrap when no metadata present', () => {
			const metadata: CodeBlockMetadata = {
				language: 'typescript',
				raw: 'typescript'
			};
			const result = wrapWithMetadata(mockHtml, metadata, mockCode);
			expect(result).toBe(mockHtml);
		});

		it('should highlight line numbers when highlightLines is provided', () => {
			const multiLineCode = 'line 1\nline 2\nline 3';
			const metadata: CodeBlockMetadata = {
				language: 'typescript',
				showLineNumbers: true,
				highlightLines: [1, 3],
				raw: 'typescript {1,3} showLineNumbers'
			};
			const result = wrapWithMetadata(mockHtml, metadata, multiLineCode);
			expect(result).toContain('line-number highlight');
		});

		it('should combine title and line numbers', () => {
			const metadata: CodeBlockMetadata = {
				language: 'typescript',
				title: 'app.ts',
				showLineNumbers: true,
				raw: 'typescript title="app.ts" showLineNumbers'
			};
			const result = wrapWithMetadata(mockHtml, metadata, mockCode);
			expect(result).toContain('code-block-title');
			expect(result).toContain('app.ts');
			expect(result).toContain('code-block-line-numbers');
		});
	});
});
