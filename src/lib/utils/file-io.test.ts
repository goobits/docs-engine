import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, readJSON, writeJSON, countLines } from './file-io';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

describe('file-io', () => {
  const testDir = join(process.cwd(), 'test-file-io-temp');

  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('readFile', () => {
    it('should read file contents', () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, World!';

      // Create test file
      writeFile(filePath, content);

      // Read it back
      const result = readFile(filePath);

      expect(result).toBe(content);
    });

    it('should throw error for non-existent file', () => {
      const filePath = join(testDir, 'non-existent.txt');

      expect(() => readFile(filePath)).toThrow('Failed to read file');
    });

    it('should read multi-line content', () => {
      const filePath = join(testDir, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3';

      writeFile(filePath, content);
      const result = readFile(filePath);

      expect(result).toBe(content);
    });

    it('should read UTF-8 content with special characters', () => {
      const filePath = join(testDir, 'special.txt');
      const content = 'Hello 世界 🌍 Ñoño';

      writeFile(filePath, content);
      const result = readFile(filePath);

      expect(result).toBe(content);
    });

    it('should read empty file', () => {
      const filePath = join(testDir, 'empty.txt');

      writeFile(filePath, '');
      const result = readFile(filePath);

      expect(result).toBe('');
    });
  });

  describe('writeFile', () => {
    it('should write file contents', () => {
      const filePath = join(testDir, 'output.txt');
      const content = 'Test content';

      writeFile(filePath, content);

      expect(existsSync(filePath)).toBe(true);
      const written = readFileSync(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create directories if they do not exist', () => {
      const filePath = join(testDir, 'nested', 'deep', 'file.txt');
      const content = 'Nested content';

      writeFile(filePath, content);

      expect(existsSync(filePath)).toBe(true);
      expect(existsSync(join(testDir, 'nested', 'deep'))).toBe(true);
    });

    it('should overwrite existing file', () => {
      const filePath = join(testDir, 'overwrite.txt');

      writeFile(filePath, 'First content');
      writeFile(filePath, 'Second content');

      const result = readFile(filePath);
      expect(result).toBe('Second content');
    });

    it('should write UTF-8 content correctly', () => {
      const filePath = join(testDir, 'unicode.txt');
      const content = '你好 Hello مرحبا';

      writeFile(filePath, content);

      const result = readFile(filePath);
      expect(result).toBe(content);
    });

    it('should write empty content', () => {
      const filePath = join(testDir, 'empty.txt');

      writeFile(filePath, '');

      expect(existsSync(filePath)).toBe(true);
      expect(readFile(filePath)).toBe('');
    });

    it('should write multiline content', () => {
      const filePath = join(testDir, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3\n';

      writeFile(filePath, content);

      expect(readFile(filePath)).toBe(content);
    });
  });

  describe('readJSON', () => {
    it('should read and parse JSON file', () => {
      const filePath = join(testDir, 'data.json');
      const data = { name: 'Test', value: 42, nested: { key: 'value' } };

      writeJSON(filePath, data);
      const result = readJSON(filePath);

      expect(result).toEqual(data);
    });

    it('should throw error for invalid JSON', () => {
      const filePath = join(testDir, 'invalid.json');

      writeFile(filePath, '{ invalid json }');

      expect(() => readJSON(filePath)).toThrow('Failed to parse JSON file');
    });

    it('should throw error for non-existent file', () => {
      const filePath = join(testDir, 'non-existent.json');

      expect(() => readJSON(filePath)).toThrow();
    });

    it('should read JSON with arrays', () => {
      const filePath = join(testDir, 'array.json');
      const data = [1, 2, 3, { name: 'test' }];

      writeJSON(filePath, data);
      const result = readJSON(filePath);

      expect(result).toEqual(data);
    });

    it('should read JSON with null values', () => {
      const filePath = join(testDir, 'null.json');
      const data = { value: null, items: [null, 1, 2] };

      writeJSON(filePath, data);
      const result = readJSON(filePath);

      expect(result).toEqual(data);
    });

    it('should support type parameter', () => {
      interface TestData {
        name: string;
        count: number;
      }

      const filePath = join(testDir, 'typed.json');
      const data: TestData = { name: 'Test', count: 5 };

      writeJSON(filePath, data);
      const result = readJSON<TestData>(filePath);

      expect(result.name).toBe('Test');
      expect(result.count).toBe(5);
    });
  });

  describe('writeJSON', () => {
    it('should write JSON with default indentation', () => {
      const filePath = join(testDir, 'output.json');
      const data = { name: 'Test', value: 42 };

      writeJSON(filePath, data);

      const content = readFile(filePath);
      expect(content).toContain('  "name"'); // 2-space indent
    });

    it('should write JSON with custom indentation', () => {
      const filePath = join(testDir, 'custom-indent.json');
      const data = { name: 'Test' };

      writeJSON(filePath, data, 4);

      const content = readFile(filePath);
      expect(content).toContain('    "name"'); // 4-space indent
    });

    it('should write complex nested JSON', () => {
      const filePath = join(testDir, 'complex.json');
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
        array: [1, 2, { nested: true }],
      };

      writeJSON(filePath, data);

      const result = readJSON(filePath);
      expect(result).toEqual(data);
    });

    it('should create directories for JSON files', () => {
      const filePath = join(testDir, 'nested', 'data.json');
      const data = { test: true };

      writeJSON(filePath, data);

      expect(existsSync(filePath)).toBe(true);
    });

    it('should write empty object', () => {
      const filePath = join(testDir, 'empty.json');

      writeJSON(filePath, {});

      const result = readJSON(filePath);
      expect(result).toEqual({});
    });

    it('should write arrays as JSON', () => {
      const filePath = join(testDir, 'array.json');
      const data = ['a', 'b', 'c'];

      writeJSON(filePath, data);

      const result = readJSON(filePath);
      expect(result).toEqual(data);
    });
  });

  describe('countLines', () => {
    it('should count lines in single-line text', () => {
      const text = 'Single line';

      expect(countLines(text)).toBe(1);
    });

    it('should count lines in multi-line text', () => {
      const text = 'Line 1\nLine 2\nLine 3';

      expect(countLines(text)).toBe(3);
    });

    it('should count empty lines', () => {
      const text = 'Line 1\n\nLine 3';

      expect(countLines(text)).toBe(3);
    });

    it('should handle text ending with newline', () => {
      const text = 'Line 1\nLine 2\n';

      expect(countLines(text)).toBe(3); // Empty string after final \n counts as a line
    });

    it('should handle empty string', () => {
      const text = '';

      expect(countLines(text)).toBe(1);
    });

    it('should handle text with only newlines', () => {
      const text = '\n\n\n';

      expect(countLines(text)).toBe(4);
    });

    it('should handle Windows line endings', () => {
      const text = 'Line 1\r\nLine 2\r\nLine 3';

      // \r\n is treated as a single line break by split('\n')
      // but \r remains in the string
      expect(countLines(text)).toBeGreaterThan(0);
    });

    it('should count lines in code block', () => {
      const text = `function test() {
  return true;
}`;

      expect(countLines(text)).toBe(3);
    });
  });
});
