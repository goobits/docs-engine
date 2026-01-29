/**
 * Parser Tests
 *
 * Tests for the parser modules extracted from generic-generator.
 */

import { describe, it, expect } from 'vitest';
import { parseJSON } from './json-parser';
import { parseEnv } from './env-parser';
import { parseSQL } from './sql-parser';

describe('parseJSON', () => {
  it('should parse array data directly', () => {
    const content = '[{"name": "foo"}, {"name": "bar"}]';
    const result = parseJSON(content);
    expect(result).toEqual([{ name: 'foo' }, { name: 'bar' }]);
  });

  it('should convert object to entries without path', () => {
    const content = '{"foo": "bar", "baz": "qux"}';
    const result = parseJSON(content);
    expect(result).toEqual([
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
    ]);
  });

  it('should extract nested path from object', () => {
    const content = '{"scripts": {"build": "tsc", "test": "vitest"}}';
    const result = parseJSON(content, 'scripts');
    expect(result).toEqual([
      { name: 'build', value: 'tsc' },
      { name: 'test', value: 'vitest' },
    ]);
  });

  it('should handle deep nested paths', () => {
    const content = '{"level1": {"level2": {"items": [{"id": 1}, {"id": 2}]}}}';
    const result = parseJSON(content, 'level1.level2.items');
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should throw for invalid path', () => {
    const content = '{"foo": "bar"}';
    expect(() => parseJSON(content, 'nonexistent')).toThrow('Path "nonexistent" not found in JSON');
  });

  it('should stringify non-string values', () => {
    const content = '{"config": {"nested": {"key": "value"}}}';
    const result = parseJSON(content, 'config');
    expect(result[0].value).toBe('{"key":"value"}');
  });
});

describe('parseEnv', () => {
  it('should parse simple variables', () => {
    const content = 'FOO=bar\nBAZ=qux';
    const result = parseEnv(content);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('FOO');
    expect(result[0].value).toBe('bar');
    expect(result[1].name).toBe('BAZ');
    expect(result[1].value).toBe('qux');
  });

  it('should detect categories with --- format', () => {
    const content = `# --- Database ---
DB_HOST=localhost
DB_PORT=5432

# --- API ---
API_KEY=secret`;
    const result = parseEnv(content);
    expect(result[0].category).toBe('Database');
    expect(result[1].category).toBe('Database');
    expect(result[2].category).toBe('API');
  });

  it('should handle commented variables', () => {
    const content = '# FOO=commented\nBAR=active';
    const result = parseEnv(content);
    expect(result).toHaveLength(2);
    expect(result[0].isCommented).toBe(true);
    expect(result[1].isCommented).toBe(false);
  });

  it('should remove quotes from values', () => {
    const content = 'FOO="quoted value"\nBAR=\'single quoted\'';
    const result = parseEnv(content);
    expect(result[0].value).toBe('quoted value');
    expect(result[1].value).toBe('single quoted');
  });

  it('should strip inline comments', () => {
    const content = 'FOO=value # this is a comment';
    const result = parseEnv(content);
    expect(result[0].value).toBe('value');
  });

  it('should handle empty values', () => {
    const content = 'FOO=';
    const result = parseEnv(content);
    expect(result[0].value).toBe('(not set)');
  });

  it('should collect description from preceding comments', () => {
    const content = `# This is the description
# of the variable
FOO=bar`;
    const result = parseEnv(content);
    expect(result[0].description).toBe('This is the description of the variable');
  });
});

describe('parseSQL', () => {
  it('should parse CREATE TABLE statements', () => {
    const content = `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT
);`;
    const result = parseSQL(content);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('users');
    expect(result[0].columns).toHaveLength(3);
  });

  it('should extract column types', () => {
    const content = `CREATE TABLE items (
  id INTEGER,
  price REAL,
  created_at TIMESTAMP
);`;
    const result = parseSQL(content);
    const columns = result[0].columns as Array<{ name: string; type: string }>;
    expect(columns[0]).toEqual({ name: 'id', type: 'INTEGER' });
    expect(columns[1]).toEqual({ name: 'price', type: 'REAL' });
    expect(columns[2]).toEqual({ name: 'created_at', type: 'TIMESTAMP' });
  });

  it('should handle CREATE TABLE IF NOT EXISTS', () => {
    const content = `CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY
);`;
    const result = parseSQL(content);
    expect(result[0].name).toBe('sessions');
  });

  it('should extract CONSTRAINT definitions', () => {
    const content = `CREATE TABLE orders (
  id INTEGER,
  user_id INTEGER,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);`;
    const result = parseSQL(content);
    const constraints = result[0].constraints as string[];
    expect(constraints).toHaveLength(1);
    expect(constraints[0]).toContain('CONSTRAINT fk_user');
  });

  it('should handle PRIMARY KEY constraints', () => {
    const content = `CREATE TABLE composite (
  a INTEGER,
  b INTEGER,
  PRIMARY KEY (a, b)
);`;
    const result = parseSQL(content);
    const constraints = result[0].constraints as string[];
    expect(constraints).toHaveLength(1);
    expect(constraints[0]).toContain('PRIMARY KEY');
  });

  it('should parse multiple tables', () => {
    const content = `CREATE TABLE users (
  id INTEGER
);

CREATE TABLE posts (
  id INTEGER
);`;
    const result = parseSQL(content);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('users');
    expect(result[1].name).toBe('posts');
  });

  it('should skip SQL comments', () => {
    const content = `CREATE TABLE items (
  -- this is a comment
  id INTEGER
);`;
    const result = parseSQL(content);
    const columns = result[0].columns as Array<{ name: string; type: string }>;
    expect(columns).toHaveLength(1);
    expect(columns[0].name).toBe('id');
  });
});
