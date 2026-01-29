/**
 * OpenAPI Formatter Utility
 *
 * Parses and formats OpenAPI 3.0 specifications for documentation generation.
 */

import { createBrowserLogger } from './browser-logger.js';

const logger = createBrowserLogger('openapi-formatter');

/**
 * OpenAPI operation object structure
 */
interface OpenAPIOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: unknown }>;
  };
  parameters?: unknown[];
  responses?: Record<string, unknown>;
}

/**
 * OpenAPI schema object structure
 */
interface OpenAPISchema {
  $ref?: string;
  type?: string;
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  enum?: unknown[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  example?: unknown;
  format?: string;
  description?: string;
}

/**
 * OpenAPI content object structure
 */
interface OpenAPIContent {
  'application/json'?: {
    schema?: unknown;
  };
}

/**
 * OpenAPI parameter object structure
 */
interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: unknown;
}

export interface OpenAPIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  requestBody?: {
    schema: unknown;
    required?: boolean;
  };
  responses: Record<
    string,
    {
      description: string;
      schema?: unknown;
    }
  >;
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    required?: boolean;
    description?: string;
    schema: unknown;
  }>;
  tags?: string[];
}

/**
 * Parse OpenAPI 3.0 specification into endpoint array
 */
export function parseOpenAPISpec(spec: unknown): OpenAPIEndpoint[] {
  if (
    !spec ||
    typeof spec !== 'object' ||
    !('paths' in spec) ||
    typeof spec.paths !== 'object' ||
    !spec.paths
  ) {
    logger.warn('Invalid OpenAPI spec: missing paths');
    return [];
  }

  const endpoints: OpenAPIEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

    for (const method of methods) {
      const operation = (pathItem as Record<string, unknown>)[method];
      if (!operation) continue;

      // Type assertion needed for OpenAPI operation object
      const op = operation as OpenAPIOperation;

      const endpoint: OpenAPIEndpoint = {
        method: method.toUpperCase() as OpenAPIEndpoint['method'],
        path,
        summary: op.summary || '',
        description: op.description,
        responses: {},
        tags: op.tags,
      };

      // Parse request body
      if (op.requestBody) {
        const content = op.requestBody.content?.['application/json'];
        if (content?.schema) {
          endpoint.requestBody = {
            schema: content.schema,
            required: op.requestBody.required,
          };
        }
      }

      // Parse parameters (query, path, header)
      if (op.parameters) {
        endpoint.parameters = op.parameters.map((param: unknown) => {
          const p = param as OpenAPIParameter;
          return {
            name: p.name,
            in: p.in,
            required: p.required,
            description: p.description,
            schema: p.schema,
          };
        });
      }

      // Parse responses
      if (op.responses) {
        for (const [statusCode, response] of Object.entries(op.responses)) {
          const responseObj = response as Record<string, unknown>;
          endpoint.responses[statusCode] = {
            description: (responseObj.description as string) || '',
            schema: (responseObj.content as OpenAPIContent | undefined)?.['application/json']
              ?.schema,
          };
        }
      }

      endpoints.push(endpoint);
    }
  }

  return endpoints;
}

/**
 * Filter endpoints by path prefix
 * Supports exact matches and wildcards
 */
export function filterEndpointsByPath(
  endpoints: OpenAPIEndpoint[],
  pathFilter: string
): OpenAPIEndpoint[] {
  if (!pathFilter || pathFilter === '*') {
    return endpoints;
  }

  // Remove leading/trailing slashes for consistent matching
  const normalizedFilter = pathFilter.replace(/^\/+|\/+$/g, '');

  return endpoints.filter((endpoint) => {
    const normalizedPath = endpoint.path.replace(/^\/+|\/+$/g, '');

    // Exact match
    if (normalizedPath === normalizedFilter) {
      return true;
    }

    // Prefix match (e.g., "/sessions" matches "/sessions/{id}")
    if (
      normalizedPath.startsWith(normalizedFilter + '/') ||
      normalizedPath.startsWith(normalizedFilter + '{')
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Format JSON schema as readable TypeScript interface
 */
export function formatSchema(schema: unknown, indent: number = 0): string {
  if (!schema) return 'any';

  // Type assertion needed for OpenAPI schema objects
  const s = schema as OpenAPISchema;

  const indentStr = '  '.repeat(indent);
  const nextIndent = '  '.repeat(indent + 1);

  // Handle $ref (dereference if needed)
  if (s.$ref) {
    const refName = s.$ref.split('/').pop();
    return refName || 'any';
  }

  // Handle array types
  if (s.type === 'array') {
    if (s.items) {
      const itemType = formatSchema(s.items, indent);
      return `${itemType}[]`;
    }
    return 'any[]';
  }

  // Handle object types
  if (s.type === 'object' || s.properties) {
    const props: string[] = [];

    if (s.properties) {
      for (const [key, prop] of Object.entries(s.properties)) {
        const propSchema = prop as Record<string, unknown>;
        const optional = !s.required?.includes(key);
        const description = propSchema.description as string | undefined;

        if (description) {
          props.push(`${nextIndent}/** ${description} */`);
        }

        const propType = formatSchema(propSchema, indent + 1);
        props.push(`${nextIndent}${key}${optional ? '?' : ''}: ${propType};`);
      }
    }

    if (props.length === 0) {
      return 'Record<string, any>';
    }

    return `{\n${props.join('\n')}\n${indentStr}}`;
  }

  // Handle enum types
  if (s.enum) {
    return s.enum.map((v: unknown) => JSON.stringify(v)).join(' | ');
  }

  // Handle union types (oneOf, anyOf)
  if (s.oneOf || s.anyOf) {
    const variants = s.oneOf ?? s.anyOf ?? [];
    return variants.map((schema: unknown) => formatSchema(schema, indent)).join(' | ');
  }

  // Handle primitive types
  switch (s.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    default:
      return 'any';
  }
}

/**
 * Generate cURL command example for endpoint
 */
export function generateCurlExample(endpoint: OpenAPIEndpoint, baseUrl: string = '/api'): string {
  const url = `${baseUrl}${endpoint.path}`;
  const lines: string[] = [`curl -X ${endpoint.method} '${url}'`];

  // Add headers
  lines.push(`  -H 'Content-Type: application/json'`);

  // Add authorization header placeholder
  if (endpoint.tags?.includes('Sessions') || endpoint.tags?.includes('Workflows')) {
    lines.push(`  -H 'Authorization: Bearer YOUR_API_KEY'`);
  }

  // Add request body for POST/PUT/PATCH
  if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    const exampleBody = generateExampleBody(endpoint.requestBody.schema);
    lines.push(`  -d '${JSON.stringify(exampleBody, null, 2).replace(/\n/g, '\n  ')}'`);
  }

  return lines.join(' \\\n');
}

/**
 * Generate TypeScript fetch() example
 */
export function generateTypeScriptExample(endpoint: OpenAPIEndpoint): string {
  const lines: string[] = [];

  // Type definitions
  if (endpoint.requestBody) {
    lines.push('interface RequestBody {');
    const formatted = formatSchema(endpoint.requestBody.schema, 0);
    if (formatted.startsWith('{')) {
      lines.push(formatted.split('\n').slice(1, -1).join('\n'));
    } else {
      lines.push(`  body: ${formatted};`);
    }
    lines.push('}\n');
  }

  // Response type from 200 response
  const successResponse = endpoint.responses['200'] || endpoint.responses['201'];
  if (successResponse?.schema) {
    lines.push('interface Response {');
    const formatted = formatSchema(successResponse.schema, 0);
    if (formatted.startsWith('{')) {
      lines.push(formatted.split('\n').slice(1, -1).join('\n'));
    } else {
      lines.push(`  data: ${formatted};`);
    }
    lines.push('}\n');
  }

  // Fetch example
  lines.push(`const response = await fetch('${endpoint.path}', {`);
  lines.push(`  method: '${endpoint.method}',`);
  lines.push(`  headers: {`);
  lines.push(`    'Content-Type': 'application/json',`);
  lines.push(`    'Authorization': 'Bearer YOUR_API_KEY',`);
  lines.push(`  },`);

  if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    const exampleBody = generateExampleBody(endpoint.requestBody.schema);
    lines.push(
      `  body: JSON.stringify(${JSON.stringify(exampleBody, null, 2).replace(/\n/g, '\n  ')}),`
    );
  }

  lines.push(`});\n`);
  lines.push(`const data: Response = await response.json();`);

  return lines.join('\n');
}

/**
 * Generate example request body from schema
 */
function generateExampleBody(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return {};

  const schemaObj = schema as Record<string, unknown>;

  if (schemaObj.$ref) {
    // Can't generate example from $ref without dereferencing
    return {};
  }

  if (schemaObj.type === 'object' || schemaObj.properties) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example: any = {};

    if (schemaObj.properties) {
      for (const [key, prop] of Object.entries(schemaObj.properties)) {
        example[key] = generateExampleValue(prop);
      }
    }

    return example;
  }

  return generateExampleValue(schema);
}

/**
 * Generate example value for a schema property
 */
function generateExampleValue(schema: unknown): unknown {
  // Type assertion needed for OpenAPI schema objects
  const s = schema as OpenAPISchema;

  if (s.example !== undefined) {
    return s.example;
  }

  if (s.enum) {
    return s.enum[0];
  }

  if (s.type === 'array') {
    return s.items ? [generateExampleValue(s.items)] : [];
  }

  if (s.type === 'object' || s.properties) {
    return generateExampleBody(schema);
  }

  switch (s.type) {
    case 'string':
      return s.format === 'date-time' ? '2025-01-01T00:00:00Z' : 'string';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    default:
      return null;
  }
}
