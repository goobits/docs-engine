import { describe, it, expect } from 'vitest';
import {
  generateTable,
  generateHeader,
  generateSection,
  escapeMarkdown,
  codeBlock,
  generateList,
} from './markdown';

describe('generateTable', () => {
  it('should generate a basic markdown table', () => {
    const headers = ['Name', 'Description'];
    const rows = [
      ['foo', 'A function'],
      ['bar', 'Another function'],
    ];
    const result = generateTable(headers, rows);

    expect(result).toContain('| Name | Description |');
    expect(result).toContain('| --- | --- |');
    expect(result).toContain('| foo | A function |');
    expect(result).toContain('| bar | Another function |');
  });

  it('should return empty string for empty headers', () => {
    const result = generateTable([], [['data']]);
    expect(result).toBe('');
  });

  it('should return empty string for empty rows', () => {
    const result = generateTable(['Header'], []);
    expect(result).toBe('');
  });

  it('should escape pipes in cell content', () => {
    const headers = ['Name', 'Value'];
    const rows = [['pipe|test', 'value|with|pipes']];
    const result = generateTable(headers, rows);

    expect(result).toContain('pipe\\|test');
    expect(result).toContain('value\\|with\\|pipes');
  });

  it('should handle numeric values in rows', () => {
    const headers = ['ID', 'Count'];
    const rows = [['123', '456']];
    const result = generateTable(headers, rows);

    expect(result).toContain('| 123 | 456 |');
  });

  it('should handle multiple rows', () => {
    const headers = ['A', 'B', 'C'];
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
    ];
    const result = generateTable(headers, rows);
    const lines = result.split('\n');

    expect(lines).toHaveLength(5); // header + separator + 3 data rows
  });

  it('should handle empty cells', () => {
    const headers = ['Name', 'Value'];
    const rows = [
      ['', 'value'],
      ['name', ''],
    ];
    const result = generateTable(headers, rows);

    expect(result).toContain('|  | value |');
    expect(result).toContain('| name |  |');
  });
});

describe('generateHeader', () => {
  it('should generate header with source file and timestamp', () => {
    const result = generateHeader('package.json');

    expect(result).toContain('> [!WARNING]');
    expect(result).toContain('> **Auto-generated documentation - Do not edit manually**');
    expect(result).toContain('> - **Source**: `package.json`');
    expect(result).toContain('> - **Generated**:');
  });

  it('should include additional note when provided', () => {
    const result = generateHeader('package.json', 'Run `pnpm docs:commands` to regenerate');

    expect(result).toContain('> - **Note**: Run `pnpm docs:commands` to regenerate');
  });

  it('should not include note line when not provided', () => {
    const result = generateHeader('test.ts');

    expect(result).not.toContain('> - **Note**:');
  });

  it('should include timestamp in ISO format', () => {
    const result = generateHeader('test.ts');
    const timestampMatch = result.match(/> - \*\*Generated\*\*: (.+)/);

    expect(timestampMatch).toBeTruthy();
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      expect(() => new Date(timestamp)).not.toThrow();
    }
  });

  it('should end with blank line', () => {
    const result = generateHeader('test.ts');
    expect(result.endsWith('\n')).toBe(true);
  });
});

describe('generateSection', () => {
  it('should generate section with default level 2', () => {
    const result = generateSection('Title', 'Content here');

    expect(result).toBe('## Title\n\nContent here\n');
  });

  it('should handle custom heading levels', () => {
    const level1 = generateSection('Title', 'Content', 1);
    const level3 = generateSection('Title', 'Content', 3);
    const level6 = generateSection('Title', 'Content', 6);

    expect(level1).toContain('# Title');
    expect(level3).toContain('### Title');
    expect(level6).toContain('###### Title');
  });

  it('should clamp level to minimum 1', () => {
    const result = generateSection('Title', 'Content', 0);
    expect(result).toContain('# Title');
  });

  it('should clamp level to maximum 6', () => {
    const result = generateSection('Title', 'Content', 10);
    expect(result).toContain('###### Title');
  });

  it('should include content after heading', () => {
    const result = generateSection('API', 'This is the API documentation', 2);

    expect(result).toContain('## API');
    expect(result).toContain('This is the API documentation');
  });

  it('should handle multiline content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const result = generateSection('Title', content, 2);

    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
    expect(result).toContain('Line 3');
  });
});

describe('escapeMarkdown', () => {
  it('should escape backticks', () => {
    const result = escapeMarkdown('Use `code` here');
    expect(result).toBe('Use \\`code\\` here');
  });

  it('should escape asterisks', () => {
    const result = escapeMarkdown('bold **text** and *italic*');
    expect(result).toBe('bold \\*\\*text\\*\\* and \\*italic\\*');
  });

  it('should escape underscores', () => {
    const result = escapeMarkdown('snake_case_name');
    expect(result).toBe('snake\\_case\\_name');
  });

  it('should escape square brackets', () => {
    const result = escapeMarkdown('[link](url)');
    expect(result).toBe('\\[link\\]\\(url\\)');
  });

  it('should escape hash symbols', () => {
    const result = escapeMarkdown('# Heading');
    expect(result).toBe('\\# Heading');
  });

  it('should escape multiple special characters', () => {
    const result = escapeMarkdown('*test* `code` [link](#anchor)');
    expect(result).toContain('\\*test\\*');
    expect(result).toContain('\\`code\\`');
    expect(result).toContain('\\[link\\]');
    expect(result).toContain('\\(\\#anchor\\)');
  });

  it('should handle text without special characters', () => {
    const result = escapeMarkdown('plain text');
    expect(result).toBe('plain text');
  });

  it('should escape backslashes', () => {
    const result = escapeMarkdown('path\\to\\file');
    expect(result).toBe('path\\\\to\\\\file');
  });
});

describe('codeBlock', () => {
  it('should generate code block with language', () => {
    const result = codeBlock('console.log("hello")', 'javascript');

    expect(result).toBe('```javascript\nconsole.log("hello")\n```');
  });

  it('should generate code block without language', () => {
    const result = codeBlock('some code');

    expect(result).toBe('```\nsome code\n```');
  });

  it('should handle empty language string', () => {
    const result = codeBlock('code here', '');

    expect(result).toBe('```\ncode here\n```');
  });

  it('should handle multiline code', () => {
    const code = 'function test() {\n  return true;\n}';
    const result = codeBlock(code, 'typescript');

    expect(result).toContain('function test()');
    expect(result).toContain('  return true;');
    expect(result).toContain('}');
  });

  it('should handle different language identifiers', () => {
    const languages = ['python', 'rust', 'go', 'bash', 'json'];

    languages.forEach((lang) => {
      const result = codeBlock('code', lang);
      expect(result).toContain('```' + lang);
    });
  });
});

describe('generateList', () => {
  it('should generate unordered list by default', () => {
    const items = ['First', 'Second', 'Third'];
    const result = generateList(items);

    expect(result).toBe('- First\n- Second\n- Third');
  });

  it('should generate ordered list when ordered=true', () => {
    const items = ['First', 'Second', 'Third'];
    const result = generateList(items, true);

    expect(result).toBe('1. First\n2. Second\n3. Third');
  });

  it('should handle single item', () => {
    const result = generateList(['Only one'], false);
    expect(result).toBe('- Only one');
  });

  it('should handle empty array', () => {
    const result = generateList([]);
    expect(result).toBe('');
  });

  it('should handle items with special characters', () => {
    const items = ['Item with `code`', 'Item with *markdown*'];
    const result = generateList(items);

    expect(result).toContain('- Item with `code`');
    expect(result).toContain('- Item with *markdown*');
  });

  it('should number items correctly in ordered list', () => {
    const items = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);
    const result = generateList(items, true);

    expect(result).toContain('1. Item 1');
    expect(result).toContain('10. Item 10');
    expect(result).toContain('12. Item 12');
  });

  it('should handle multiline items', () => {
    const items = ['First line\nSecond line', 'Another item'];
    const result = generateList(items);

    expect(result).toContain('- First line\nSecond line');
  });
});
