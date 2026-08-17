import type { ApiSymbolMap } from '@goobits/docs-engine/utils';
import { createApiSymbolGenerator, type ApiSymbolGeneratorConfig } from './apiSymbolGenerator.js';

/** Extract the configured public API surface and persist its deterministic symbol map. */
export async function extractPackageApi(config: ApiSymbolGeneratorConfig): Promise<ApiSymbolMap> {
  return createApiSymbolGenerator(config).generate();
}
