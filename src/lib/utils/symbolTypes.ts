/** TypeScript symbol metadata shared by symbol generation and resolution. */
export interface SymbolDefinition {
  name: string;
  path: string;
  line: number;
  kind: 'type' | 'interface' | 'class' | 'function' | 'enum' | 'const';
  exported: boolean;
  jsDoc?: {
    description?: string;
    params?: Array<{ name: string; description: string; type: string }>;
    returns?: string;
    example?: string;
    see?: string[];
  };
  signature: string;
  related?: string[];
  extends?: string[];
  implements?: string[];
}

/** Symbol definitions indexed by their exported name. */
export interface SymbolMap {
  [symbolName: string]: SymbolDefinition[];
}
