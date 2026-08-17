/** Public API metadata consumed by reference rendering. */
export interface ApiSymbol {
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

/** Public API symbols indexed by their exported name. */
export interface ApiSymbolMap {
  [symbolName: string]: ApiSymbol[];
}
