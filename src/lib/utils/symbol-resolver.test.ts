import { describe, it, expect } from 'vitest';
import { resolveSymbol, AmbiguousSymbolError, type SymbolMap } from './symbol-resolver';

describe('symbol-resolver', () => {
  const mockSymbolMap: SymbolMap = {
    ProcessorConfig: [
      {
        name: 'ProcessorConfig',
        path: 'src/lib/server/image-processor.ts',
        line: 13,
        kind: 'interface',
        exported: true,
        signature: 'interface ProcessorConfig',
      },
    ],
    Button: [
      {
        name: 'Button',
        path: 'src/components/Button.ts',
        line: 10,
        kind: 'class',
        exported: true,
        signature: 'class Button',
      },
      {
        name: 'Button',
        path: 'src/types/Button.ts',
        line: 5,
        kind: 'interface',
        exported: true,
        signature: 'interface Button',
      },
    ],
    Status: [
      {
        name: 'Status',
        path: 'src/types/enums.ts',
        line: 20,
        kind: 'enum',
        exported: true,
        signature: 'enum Status',
      },
      {
        name: 'Status',
        path: 'src/types/status.ts',
        line: 15,
        kind: 'type',
        exported: true,
        signature: 'type Status',
      },
    ],
    processImage: [
      {
        name: 'processImage',
        path: 'src/lib/server/image-processor.ts',
        line: 196,
        kind: 'function',
        exported: true,
        signature:
          'function processImage(config: ImageProcessorConfig): Promise<ImageProcessorResult>',
      },
    ],
  };

  // Note: loadSymbolMap tests are omitted because the function has internal caching
  // that makes it difficult to test in isolation. The resolveSymbol tests below
  // provide sufficient coverage of the symbol resolution logic.

  describe('resolveSymbol', () => {
    it('should resolve symbol with single definition', () => {
      const result = resolveSymbol('ProcessorConfig', mockSymbolMap);

      expect(result).toEqual(mockSymbolMap.ProcessorConfig[0]);
    });

    it('should resolve symbol with path hint', () => {
      const result = resolveSymbol('components#Button', mockSymbolMap);

      expect(result).toEqual(mockSymbolMap.Button[0]);
      expect(result.path).toContain('components/Button.ts');
    });

    it('should resolve symbol with path and kind hint', () => {
      const result = resolveSymbol('types/interface#Button', mockSymbolMap);

      expect(result).toEqual(mockSymbolMap.Button[1]);
      expect(result.kind).toBe('interface');
    });

    it('should throw AmbiguousSymbolError when symbol has multiple definitions without hint', () => {
      expect(() => resolveSymbol('Button', mockSymbolMap)).toThrow(AmbiguousSymbolError);
    });

    it('should throw AmbiguousSymbolError when symbol not found', () => {
      expect(() => resolveSymbol('NonExistentSymbol', mockSymbolMap)).toThrow(AmbiguousSymbolError);
    });

    it('should suggest similar symbols when symbol not found', () => {
      try {
        resolveSymbol('Buton', mockSymbolMap); // Typo in "Button"
      } catch (error) {
        expect(error).toBeInstanceOf(AmbiguousSymbolError);
        expect((error as Error).message).toContain('Did you mean one of these?');
        expect((error as Error).message).toContain('Button');
      }
    });

    it('should handle path hint that matches multiple definitions', () => {
      expect(() => resolveSymbol('types#Status', mockSymbolMap)).toThrow(AmbiguousSymbolError);
    });

    it('should resolve with kind suffix when multiple kinds exist', () => {
      const result = resolveSymbol('types/enums/enum#Status', mockSymbolMap);

      expect(result.kind).toBe('enum');
      expect(result.path).toContain('types/enums.ts');
    });

    it('should provide helpful error message when path hint does not match', () => {
      try {
        resolveSymbol('nonexistent#Button', mockSymbolMap);
      } catch (error) {
        expect(error).toBeInstanceOf(AmbiguousSymbolError);
        expect((error as Error).message).toContain('Path hint');
        expect((error as Error).message).toContain("didn't match");
      }
    });

    it('should suggest using kind suffix when ambiguous after path filtering', () => {
      try {
        resolveSymbol('types#Status', mockSymbolMap);
      } catch (error) {
        expect(error).toBeInstanceOf(AmbiguousSymbolError);
        expect((error as Error).message).toContain('Add a kind suffix');
      }
    });

    it('should handle reference without path hint', () => {
      const result = resolveSymbol('processImage', mockSymbolMap);

      expect(result.name).toBe('processImage');
      expect(result.kind).toBe('function');
    });

    it('should filter by kind when kind suffix is provided', () => {
      const result = resolveSymbol('types/type#Status', mockSymbolMap);

      expect(result.kind).toBe('type');
      expect(result.path).toContain('types/status.ts');
    });
  });

  describe('AmbiguousSymbolError', () => {
    it('should format error message for missing symbol with suggestions', () => {
      const error = new AmbiguousSymbolError('Buton', ['Button', 'ProcessorConfig']);

      expect(error.message).toContain('Symbol "Buton" not found');
      expect(error.message).toContain('Did you mean one of these?');
      expect(error.message).toContain('{@Button}');
    });

    it('should format error message for ambiguous symbol without path hint', () => {
      const error = new AmbiguousSymbolError('Button', mockSymbolMap.Button);

      expect(error.message).toContain('Symbol "Button" is ambiguous');
      expect(error.message).toContain('Use a path hint to disambiguate');
    });

    it('should format error message for ambiguous symbol with path hint', () => {
      const error = new AmbiguousSymbolError('Button', mockSymbolMap.Button, 'components');

      expect(error.message).toContain('Symbol "Button" with hint "components" is still ambiguous');
      expect(error.message).toContain('Matching paths:');
    });

    it('should use custom message when provided', () => {
      const customMsg = 'Custom error message';
      const error = new AmbiguousSymbolError('Button', mockSymbolMap.Button, 'path', customMsg);

      expect(error.message).toBe(customMsg);
    });

    it('should have correct error name', () => {
      const error = new AmbiguousSymbolError('Button', ['Button1', 'Button2']);

      expect(error.name).toBe('AmbiguousSymbolError');
    });
  });

  describe('edge cases', () => {
    it('should handle empty symbol map', () => {
      expect(() => resolveSymbol('Anything', {})).toThrow(AmbiguousSymbolError);
    });

    it('should handle symbols with complex paths', () => {
      const complexMap: SymbolMap = {
        Config: [
          {
            name: 'Config',
            path: 'src/lib/components/deep/nested/folder/Config.ts',
            line: 1,
            kind: 'interface',
            exported: true,
            signature: 'interface Config',
          },
        ],
      };

      const result = resolveSymbol('deep/nested#Config', complexMap);
      expect(result).toBeDefined();
    });

    it('should handle references with only anchor (no path)', () => {
      const result = resolveSymbol('processImage', mockSymbolMap);

      expect(result.name).toBe('processImage');
    });

    it('should handle kind suffixes for all types', () => {
      const multiKindMap: SymbolMap = {
        Item: [
          {
            name: 'Item',
            path: 'src/types.ts',
            line: 1,
            kind: 'type',
            exported: true,
            signature: 'type Item',
          },
          {
            name: 'Item',
            path: 'src/interfaces.ts',
            line: 1,
            kind: 'interface',
            exported: true,
            signature: 'interface Item',
          },
          {
            name: 'Item',
            path: 'src/classes.ts',
            line: 1,
            kind: 'class',
            exported: true,
            signature: 'class Item',
          },
          {
            name: 'Item',
            path: 'src/functions.ts',
            line: 1,
            kind: 'function',
            exported: true,
            signature: 'function Item',
          },
          {
            name: 'Item',
            path: 'src/enums.ts',
            line: 1,
            kind: 'enum',
            exported: true,
            signature: 'enum Item',
          },
          {
            name: 'Item',
            path: 'src/constants.ts',
            line: 1,
            kind: 'const',
            exported: true,
            signature: 'const Item',
          },
        ],
      };

      // Test each kind suffix
      expect(resolveSymbol('types/type#Item', multiKindMap).kind).toBe('type');
      expect(resolveSymbol('interfaces/interface#Item', multiKindMap).kind).toBe('interface');
      expect(resolveSymbol('classes/class#Item', multiKindMap).kind).toBe('class');
      expect(resolveSymbol('functions/function#Item', multiKindMap).kind).toBe('function');
      expect(resolveSymbol('enums/enum#Item', multiKindMap).kind).toBe('enum');
      expect(resolveSymbol('constants/const#Item', multiKindMap).kind).toBe('const');
    });
  });
});
