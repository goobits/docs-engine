/**
 * Tests for API documentation markdown generator
 */

import { describe, it, expect } from 'vitest';
import type {
  ApiFunction,
  ApiClass,
  ApiInterface,
  ApiTypeAlias,
  ApiEnum,
  ApiMetadata,
  ParsedApiFile,
  ApiItem,
} from './api-parser.js';
import {
  generateMarkdown,
  groupByCategory,
  generateApiDocFile,
  generateIndexFile,
  type MarkdownGeneratorConfig,
} from './api-docs.js';

// Test helpers
const defaultMetadata: ApiMetadata = {
  isPublic: true,
  tags: {},
};

const defaultSource = {
  file: 'src/example.ts',
  line: 10,
};

describe('generateMarkdown - Functions', () => {
  it('should generate basic function documentation', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'testFunc',
      signature: 'function testFunc(): void',
      description: 'A test function',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('## testFunc');
    expect(result).toContain('A test function');
    expect(result).toContain('function testFunc(): void');
    expect(result).toContain('---');
  });

  it('should generate function with parameters', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'add',
      signature: 'function add(a: number, b: number): number',
      description: 'Adds two numbers',
      parameters: [
        { name: 'a', type: 'number', optional: false },
        { name: 'b', type: 'number', optional: false },
      ],
      returnType: 'number',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**Parameters:**');
    expect(result).toContain('**`a`**: `number`');
    expect(result).toContain('**`b`**: `number`');
    expect(result).toContain('**Returns:** `number`');
  });

  it('should generate function with optional parameters', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'greet',
      signature: 'function greet(name: string, title?: string): string',
      description: 'Greets a person',
      parameters: [
        { name: 'name', type: 'string', optional: false },
        { name: 'title', type: 'string', optional: true, description: 'Optional title' },
      ],
      returnType: 'string',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**`name`**: `string`');
    expect(result).toContain('**`title`** (optional): `string` - Optional title');
    expect(result).toContain('name: string, title?: string');
  });

  it('should generate function with default parameters', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'multiply',
      signature: 'function multiply(value: number, factor?: number): number',
      description: 'Multiplies a number',
      parameters: [
        { name: 'value', type: 'number', optional: false },
        { name: 'factor', type: 'number', optional: true, defaultValue: '2' },
      ],
      returnType: 'number',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**`factor`** (optional): `number` = `2`');
    expect(result).toContain('factor?: number = 2');
  });

  it('should generate function with type parameters', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'identity',
      signature: 'function identity<T>(value: T): T',
      description: 'Returns input value',
      typeParameters: ['T'],
      parameters: [{ name: 'value', type: 'T', optional: false }],
      returnType: 'T',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('function identity<T>(value: T): T');
  });

  it('should generate function with examples', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'sum',
      signature: 'function sum(): number',
      description: 'Calculates sum',
      parameters: [],
      returnType: 'number',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [
        { code: 'const result = sum(1, 2);', caption: 'Basic usage' },
        { code: 'const total = sum(...numbers);' },
      ],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**Examples:**');
    expect(result).toContain('*Basic usage*');
    expect(result).toContain('```typescript\nconst result = sum(1, 2);\n```');
    expect(result).toContain('const total = sum(...numbers);');
  });

  it('should generate function with return description', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'calculate',
      signature: 'function calculate(): number',
      description: 'Performs calculation',
      parameters: [],
      returnType: 'number',
      returnDescription: 'The calculated result',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**Returns:** `number` - The calculated result');
  });

  it('should not show returns section for void functions', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'logMessage',
      description: 'Logs a message',
      parameters: [{ name: 'msg', type: 'string', optional: false }],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).not.toContain('**Returns:**');
  });
});

describe('generateMarkdown - Classes', () => {
  it('should generate basic class documentation', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'TestClass',
      description: 'A test class',
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('## TestClass');
    expect(result).toContain('A test class');
    expect(result).toContain('class TestClass');
    expect(result).toContain('---');
  });

  it('should generate class with properties', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'Person',
      description: 'Represents a person',
      properties: [
        { name: 'name', type: 'string', optional: false, readonly: false },
        {
          name: 'age',
          type: 'number',
          optional: false,
          readonly: false,
          description: 'Person age',
        },
      ],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('### Properties');
    expect(result).toContain('#### `name`');
    expect(result).toContain('**Type:** `string`');
    expect(result).toContain('#### `age`');
    expect(result).toContain('Person age');
  });

  it('should generate class with readonly and optional properties', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'Config',
      description: 'Configuration class',
      properties: [
        { name: 'id', type: 'string', optional: false, readonly: true },
        { name: 'debug', type: 'boolean', optional: true, readonly: false },
      ],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('#### `id` (readonly)');
    expect(result).toContain('#### `debug` (optional)');
  });

  it('should generate class with methods', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'Calculator',
      description: 'A calculator',
      properties: [],
      methods: [
        {
          name: 'add',
          description: 'Adds numbers',
          parameters: [
            { name: 'a', type: 'number', optional: false },
            { name: 'b', type: 'number', optional: false },
          ],
          returnType: 'number',
          metadata: defaultMetadata,
        },
      ],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('### Methods');
    expect(result).toContain('#### add()');
    expect(result).toContain('Adds numbers');
    expect(result).toContain('**Parameters:**');
  });

  it('should generate class with constructor', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'Database',
      description: 'Database connection',
      properties: [],
      methods: [],
      constructorDoc: {
        description: 'Creates a new database connection',
        parameters: [
          { name: 'url', type: 'string', optional: false, description: 'Connection URL' },
        ],
      },
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('### Constructor');
    expect(result).toContain('Creates a new database connection');
    expect(result).toContain('**`url`**: `string` - Connection URL');
  });

  it('should generate class with extends and implements', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'SpecialList',
      description: 'A special list',
      extends: 'Array',
      implements: ['Iterable', 'Serializable'],
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('class SpecialList extends Array implements Iterable, Serializable');
  });

  it('should generate class with type parameters', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'Container',
      description: 'Generic container',
      typeParameters: ['T'],
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('class Container<T>');
  });
});

describe('generateMarkdown - Interfaces', () => {
  it('should generate basic interface documentation', () => {
    const iface: ApiInterface = {
      kind: 'interface',
      name: 'User',
      description: 'User interface',
      properties: [
        { name: 'id', type: 'string', optional: false, readonly: false },
        { name: 'name', type: 'string', optional: false, readonly: false },
      ],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(iface);

    expect(result).toContain('## User');
    expect(result).toContain('User interface');
    expect(result).toContain('interface User');
    expect(result).toContain('### Properties');
    expect(result).toContain('#### `id`');
    expect(result).toContain('#### `name`');
  });

  it('should generate interface with extends', () => {
    const iface: ApiInterface = {
      kind: 'interface',
      name: 'Employee',
      description: 'Employee interface',
      extends: ['Person', 'Identifiable'],
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(iface);

    expect(result).toContain('interface Employee extends Person, Identifiable');
  });

  it('should generate interface with type parameters', () => {
    const iface: ApiInterface = {
      kind: 'interface',
      name: 'Result',
      description: 'Result wrapper',
      typeParameters: ['T', 'E'],
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(iface);

    expect(result).toContain('interface Result<T, E>');
  });

  it('should generate interface with methods', () => {
    const iface: ApiInterface = {
      kind: 'interface',
      name: 'Repository',
      description: 'Data repository',
      properties: [],
      methods: [
        {
          name: 'save',
          description: 'Saves an item',
          parameters: [{ name: 'item', type: 'T', optional: false }],
          returnType: 'Promise<void>',
          metadata: defaultMetadata,
        },
      ],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(iface);

    expect(result).toContain('### Methods');
    expect(result).toContain('#### save()');
    expect(result).toContain('Saves an item');
  });
});

describe('generateMarkdown - Type Aliases', () => {
  it('should generate basic type alias documentation', () => {
    const type: ApiTypeAlias = {
      kind: 'type',
      name: 'ID',
      description: 'Unique identifier',
      definition: 'string | number',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(type);

    expect(result).toContain('## ID');
    expect(result).toContain('Unique identifier');
    expect(result).toContain('type ID = string | number');
  });

  it('should generate type alias with type parameters', () => {
    const type: ApiTypeAlias = {
      kind: 'type',
      name: 'Callback',
      description: 'Callback function type',
      typeParameters: ['T'],
      definition: '(value: T) => void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(type);

    expect(result).toContain('type Callback<T> = (value: T) => void');
  });

  it('should generate type alias with complex definition', () => {
    const type: ApiTypeAlias = {
      kind: 'type',
      name: 'ComplexType',
      description: 'A complex type',
      definition: '{ foo: string; bar: number } & { baz: boolean }',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(type);

    expect(result).toContain('type ComplexType = { foo: string; bar: number } & { baz: boolean }');
  });
});

describe('generateMarkdown - Enums', () => {
  it('should generate basic enum documentation', () => {
    const enumItem: ApiEnum = {
      kind: 'enum',
      name: 'Status',
      description: 'Status codes',
      members: [
        { name: 'Active', value: 'active', description: 'Active status' },
        { name: 'Inactive', value: 'inactive', description: 'Inactive status' },
      ],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(enumItem);

    expect(result).toContain('## Status');
    expect(result).toContain('Status codes');
    expect(result).toContain('### Members');
    expect(result).toContain('**`Active`** = "active" - Active status');
    expect(result).toContain('**`Inactive`** = "inactive" - Inactive status');
  });

  it('should generate enum with numeric values', () => {
    const enumItem: ApiEnum = {
      kind: 'enum',
      name: 'Priority',
      description: 'Priority levels',
      members: [
        { name: 'Low', value: 1 },
        { name: 'Medium', value: 2 },
        { name: 'High', value: 3 },
      ],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(enumItem);

    expect(result).toContain('**`Low`** = 1');
    expect(result).toContain('**`Medium`** = 2');
    expect(result).toContain('**`High`** = 3');
  });

  it('should generate enum members without values', () => {
    const enumItem: ApiEnum = {
      kind: 'enum',
      name: 'Direction',
      description: 'Directions',
      members: [{ name: 'North' }, { name: 'South' }],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(enumItem);

    expect(result).toContain('**`North`**');
    expect(result).toContain('**`South`**');
    expect(result).not.toContain('=');
  });
});

describe('Metadata - Badges and Tags', () => {
  it('should generate deprecated badge and notice', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'oldFunc',
      description: 'An old function',
      parameters: [],
      returnType: 'void',
      metadata: {
        ...defaultMetadata,
        deprecated: 'Use newFunc instead',
      },
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**⚠️ DEPRECATED**');
    expect(result).toContain('**Deprecation Notice:** Use newFunc instead');
  });

  it('should generate experimental badge', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'betaFunc',
      description: 'A beta function',
      parameters: [],
      returnType: 'void',
      metadata: {
        ...defaultMetadata,
        experimental: true,
      },
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**🧪 EXPERIMENTAL**');
  });

  it('should generate since badge', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'newFunc',
      description: 'A new function',
      parameters: [],
      returnType: 'void',
      metadata: {
        ...defaultMetadata,
        since: 'v2.0.0',
      },
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**Added in:** v2.0.0');
  });

  it('should generate multiple badges', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'testFunc',
      description: 'Test function',
      parameters: [],
      returnType: 'void',
      metadata: {
        ...defaultMetadata,
        deprecated: 'Will be removed',
        experimental: true,
        since: 'v1.5.0',
      },
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**⚠️ DEPRECATED**');
    expect(result).toContain('**🧪 EXPERIMENTAL**');
    expect(result).toContain('**Added in:** v1.5.0');
    expect(result).toContain('·');
  });
});

describe('Type Linking', () => {
  it('should not link built-in types', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [
        { name: 'str', type: 'string', optional: false },
        { name: 'num', type: 'number', optional: false },
        { name: 'bool', type: 'boolean', optional: false },
        { name: 'any', type: 'any', optional: false },
        { name: 'unknown', type: 'unknown', optional: false },
      ],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**`str`**: `string`');
    expect(result).toContain('**`num`**: `number`');
    expect(result).toContain('**`bool`**: `boolean`');
    expect(result).toContain('**`any`**: `any`');
    expect(result).toContain('**`unknown`**: `unknown`');
  });

  it('should link custom types with baseUrl', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [{ name: 'user', type: 'User', optional: false }],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const config: MarkdownGeneratorConfig = {
      baseUrl: '/api',
    };

    const result = generateMarkdown(func, config);

    expect(result).toContain('[`User`](/api/user)');
  });

  it('should use custom type links', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [{ name: 'config', type: 'Config', optional: false }],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const config: MarkdownGeneratorConfig = {
      typeLinks: {
        Config: '/docs/config',
      },
    };

    const result = generateMarkdown(func, config);

    expect(result).toContain('[`Config`](/docs/config)');
  });

  it('should escape but not link complex types', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [
        { name: 'generic', type: 'Array<string>', optional: false },
        { name: 'union', type: 'string | number', optional: false },
        { name: 'intersection', type: 'A & B', optional: false },
        { name: 'array', type: 'string[]', optional: false },
      ],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('`Array&lt;string&gt;`');
    expect(result).toContain('`string | number`');
    expect(result).toContain('`A & B`');
    expect(result).toContain('`string[]`');
  });

  it('should escape angle brackets in types', () => {
    const type: ApiTypeAlias = {
      kind: 'type',
      name: 'Handler',
      description: 'Event handler',
      definition: 'Map<string, Set<Listener>>',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(type);

    // The definition in code blocks doesn't need escaping
    expect(result).toContain('type Handler = Map<string, Set<Listener>>');
  });
});

describe('Source Links', () => {
  it('should not generate source links by default', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: { file: 'src/test.ts', line: 42 },
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).not.toContain('**Source:**');
  });

  it('should generate source links when configured', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: { file: 'src/test.ts', line: 42 },
      examples: [],
    };

    const config: MarkdownGeneratorConfig = {
      includeSourceLinks: true,
      repoUrl: 'https://github.com/user/repo',
    };

    const result = generateMarkdown(func, config);

    expect(result).toContain('**Source:**');
    expect(result).toContain(
      '[src/test.ts:42](https://github.com/user/repo/blob/main/src/test.ts#L42)'
    );
  });

  it('should use custom branch for source links', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: { file: 'src/test.ts', line: 10 },
      examples: [],
    };

    const config: MarkdownGeneratorConfig = {
      includeSourceLinks: true,
      repoUrl: 'https://github.com/user/repo',
      repoBranch: 'develop',
    };

    const result = generateMarkdown(func, config);

    expect(result).toContain('https://github.com/user/repo/blob/develop/src/test.ts#L10');
  });

  it('should normalize Windows paths in source links', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: { file: 'src\\utils\\test.ts', line: 5 },
      examples: [],
    };

    const config: MarkdownGeneratorConfig = {
      includeSourceLinks: true,
      repoUrl: 'https://github.com/user/repo',
    };

    const result = generateMarkdown(func, config);

    expect(result).toContain('src/utils/test.ts');
    expect(result).not.toContain('\\');
  });
});

describe('Edge Cases', () => {
  it('should handle empty descriptions', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: '',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('## test');
    expect(result).toContain('function test(): void');
  });

  it('should handle missing descriptions', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('## test');
  });

  it('should handle special characters in names', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: '$special_name',
      description: 'Special function',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('## $special_name');
    expect(result).toContain('function $special_name(): void');
  });

  it('should handle parameters without descriptions', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [{ name: 'param', type: 'string', optional: false }],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain('**`param`**: `string`');
  });

  it('should handle long descriptions', () => {
    const longDesc = 'A'.repeat(500);
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: longDesc,
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).toContain(longDesc);
  });

  it('should handle empty parameter list', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [],
      returnType: 'string',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).not.toContain('**Parameters:**');
    expect(result).toContain('function test(): string');
  });

  it('should handle empty examples list', () => {
    const func: ApiFunction = {
      kind: 'function',
      name: 'test',
      description: 'Test',
      parameters: [],
      returnType: 'void',
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(func);

    expect(result).not.toContain('**Examples:**');
  });

  it('should handle class with no properties or methods', () => {
    const cls: ApiClass = {
      kind: 'class',
      name: 'Empty',
      description: 'Empty class',
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(cls);

    expect(result).toContain('## Empty');
    expect(result).not.toContain('### Properties');
    expect(result).not.toContain('### Methods');
  });

  it('should handle interface with no properties or methods', () => {
    const iface: ApiInterface = {
      kind: 'interface',
      name: 'Empty',
      description: 'Empty interface',
      properties: [],
      methods: [],
      metadata: defaultMetadata,
      source: defaultSource,
      examples: [],
    };

    const result = generateMarkdown(iface);

    expect(result).toContain('## Empty');
    expect(result).not.toContain('### Properties');
    expect(result).not.toContain('### Methods');
  });
});

describe('groupByCategory', () => {
  it('should group items by category', () => {
    const items: ApiItem[] = [
      {
        kind: 'function',
        name: 'funcA',
        parameters: [],
        returnType: 'void',
        metadata: { ...defaultMetadata, category: 'Utils' },
        source: defaultSource,
        examples: [],
      },
      {
        kind: 'function',
        name: 'funcB',
        parameters: [],
        returnType: 'void',
        metadata: { ...defaultMetadata, category: 'Utils' },
        source: defaultSource,
        examples: [],
      },
      {
        kind: 'function',
        name: 'funcC',
        parameters: [],
        returnType: 'void',
        metadata: { ...defaultMetadata, category: 'Core' },
        source: defaultSource,
        examples: [],
      },
    ];

    const groups = groupByCategory(items);

    expect(groups.size).toBe(2);
    expect(groups.get('Utils')).toHaveLength(2);
    expect(groups.get('Core')).toHaveLength(1);
  });

  it('should use "Uncategorized" for items without category', () => {
    const items: ApiItem[] = [
      {
        kind: 'function',
        name: 'func',
        parameters: [],
        returnType: 'void',
        metadata: defaultMetadata,
        source: defaultSource,
        examples: [],
      },
    ];

    const groups = groupByCategory(items);

    expect(groups.has('Uncategorized')).toBe(true);
    expect(groups.get('Uncategorized')).toHaveLength(1);
  });

  it('should sort items alphabetically within each category', () => {
    const items: ApiItem[] = [
      {
        kind: 'function',
        name: 'zebra',
        parameters: [],
        returnType: 'void',
        metadata: { ...defaultMetadata, category: 'Utils' },
        source: defaultSource,
        examples: [],
      },
      {
        kind: 'function',
        name: 'apple',
        parameters: [],
        returnType: 'void',
        metadata: { ...defaultMetadata, category: 'Utils' },
        source: defaultSource,
        examples: [],
      },
      {
        kind: 'function',
        name: 'mango',
        parameters: [],
        returnType: 'void',
        metadata: { ...defaultMetadata, category: 'Utils' },
        source: defaultSource,
        examples: [],
      },
    ];

    const groups = groupByCategory(items);
    const utilsGroup = groups.get('Utils')!;

    expect(utilsGroup[0].name).toBe('apple');
    expect(utilsGroup[1].name).toBe('mango');
    expect(utilsGroup[2].name).toBe('zebra');
  });
});

describe('generateApiDocFile', () => {
  it('should generate complete API doc file', () => {
    const parsedFile: ParsedApiFile = {
      file: 'src/lib/example.ts',
      items: [
        {
          kind: 'function',
          name: 'testFunc',
          description: 'Test function',
          parameters: [],
          returnType: 'void',
          metadata: { ...defaultMetadata, category: 'Core' },
          source: defaultSource,
          examples: [],
        },
      ],
    };

    const result = generateApiDocFile(parsedFile);

    expect(result.fileName).toBe('example.md');
    expect(result.content).toContain('# example');
    expect(result.content).toContain(
      '> Auto-generated API documentation from `src/lib/example.ts`'
    );
    expect(result.content).toContain('## Table of Contents');
    expect(result.content).toContain('### Core');
    expect(result.content).toContain('- [testFunc](#testfunc)');
    expect(result.content).toContain('## testFunc');
  });

  it('should handle files without category grouping', () => {
    const parsedFile: ParsedApiFile = {
      file: 'src/utils.ts',
      items: [
        {
          kind: 'function',
          name: 'utilA',
          parameters: [],
          returnType: 'void',
          metadata: defaultMetadata,
          source: defaultSource,
          examples: [],
        },
      ],
    };

    const result = generateApiDocFile(parsedFile);

    expect(result.content).toContain('### Uncategorized');
  });

  it('should generate file name from path', () => {
    const parsedFile: ParsedApiFile = {
      file: 'src/deep/nested/module.ts',
      items: [],
    };

    const result = generateApiDocFile(parsedFile);

    expect(result.fileName).toBe('module.md');
  });

  it('should handle path without extension', () => {
    const parsedFile: ParsedApiFile = {
      file: 'src/module',
      items: [],
    };

    const result = generateApiDocFile(parsedFile);

    expect(result.fileName).toBe('module.md');
  });
});

describe('generateIndexFile', () => {
  it('should generate index file with module list', () => {
    const files = [
      {
        fileName: 'utils.md',
        items: [
          {
            kind: 'function' as const,
            name: 'helper',
            parameters: [],
            returnType: 'void',
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
        ],
      },
    ];

    const result = generateIndexFile(files);

    expect(result).toContain('# API Reference');
    expect(result).toContain('Auto-generated API documentation.');
    expect(result).toContain('## Modules');
    expect(result).toContain('### [utils](./utils.md)');
    expect(result).toContain('**Functions:** helper');
  });

  it('should list all API item types', () => {
    const files = [
      {
        fileName: 'complete.md',
        items: [
          {
            kind: 'function' as const,
            name: 'func1',
            parameters: [],
            returnType: 'void',
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
          {
            kind: 'class' as const,
            name: 'Class1',
            properties: [],
            methods: [],
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
          {
            kind: 'interface' as const,
            name: 'Interface1',
            properties: [],
            methods: [],
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
          {
            kind: 'type' as const,
            name: 'Type1',
            definition: 'string',
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
          {
            kind: 'enum' as const,
            name: 'Enum1',
            members: [],
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
        ],
      },
    ];

    const result = generateIndexFile(files);

    expect(result).toContain('**Functions:** func1');
    expect(result).toContain('**Classes:** Class1');
    expect(result).toContain('**Interfaces:** Interface1');
    expect(result).toContain('**Types:** Type1');
    expect(result).toContain('**Enums:** Enum1');
  });

  it('should handle multiple items of same type', () => {
    const files = [
      {
        fileName: 'multi.md',
        items: [
          {
            kind: 'function' as const,
            name: 'funcA',
            parameters: [],
            returnType: 'void',
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
          {
            kind: 'function' as const,
            name: 'funcB',
            parameters: [],
            returnType: 'void',
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
        ],
      },
    ];

    const result = generateIndexFile(files);

    expect(result).toContain('**Functions:** funcA, funcB');
  });

  it('should handle multiple modules', () => {
    const files = [
      {
        fileName: 'module1.md',
        items: [
          {
            kind: 'function' as const,
            name: 'func1',
            parameters: [],
            returnType: 'void',
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
        ],
      },
      {
        fileName: 'module2.md',
        items: [
          {
            kind: 'class' as const,
            name: 'Class2',
            properties: [],
            methods: [],
            metadata: defaultMetadata,
            source: defaultSource,
            examples: [],
          },
        ],
      },
    ];

    const result = generateIndexFile(files);

    expect(result).toContain('### [module1](./module1.md)');
    expect(result).toContain('### [module2](./module2.md)');
  });

  it('should handle empty module', () => {
    const files = [
      {
        fileName: 'empty.md',
        items: [],
      },
    ];

    const result = generateIndexFile(files);

    expect(result).toContain('### [empty](./empty.md)');
    expect(result).not.toContain('**Functions:**');
    expect(result).not.toContain('**Classes:**');
  });
});
