/**
 * OpenAPI Formatter Utility
 *
 * Parses and formats OpenAPI 3.0 specifications for documentation generation.
 */

export interface OpenAPIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  requestBody?: {
    schema: any;
    required?: boolean;
  };
  responses: Record<
    string,
    {
      description: string;
      schema?: any;
    }
  >;
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    required?: boolean;
    description?: string;
    schema: any;
  }>;
  tags?: string[];
}

/**
 * Parse OpenAPI 3.0 specification into endpoint array
 */
export function parseOpenAPISpec(spec: any): OpenAPIEndpoint[] {
  if (!spec || !spec.paths) {
    console.warn('[OpenAPI] Invalid spec: missing paths');
    return [];
  }

  const endpoints: OpenAPIEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

    for (const method of methods) {
      const operation = (pathItem as any)[method];
      if (!operation) continue;

      const endpoint: OpenAPIEndpoint = {
        method: method.toUpperCase() as OpenAPIEndpoint['method'],
        path,
        summary: operation.summary || '',
        description: operation.description,
        responses: {},
        tags: operation.tags,
      };

      // Parse request body
      if (operation.requestBody) {
        const content = operation.requestBody.content?.['application/json'];
        if (content?.schema) {
          endpoint.requestBody = {
            schema: content.schema,
            required: operation.requestBody.required,
          };
        }
      }

      // Parse parameters (query, path, header)
      if (operation.parameters) {
        endpoint.parameters = operation.parameters.map((param: any) => ({
          name: param.name,
          in: param.in,
          required: param.required,
          description: param.description,
          schema: param.schema,
        }));
      }

      // Parse responses
      if (operation.responses) {
        for (const [statusCode, response] of Object.entries(operation.responses)) {
          const responseObj = response as any;
          endpoint.responses[statusCode] = {
            description: responseObj.description || '',
            schema: responseObj.content?.['application/json']?.schema,
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
export function formatSchema(schema: any, indent: number = 0): string {
  if (!schema) return 'any';

  const indentStr = '  '.repeat(indent);
  const nextIndent = '  '.repeat(indent + 1);

  // Handle $ref (dereference if needed)
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    return refName || 'any';
  }

  // Handle array types
  if (schema.type === 'array') {
    if (schema.items) {
      const itemType = formatSchema(schema.items, indent);
      return `${itemType}[]`;
    }
    return 'any[]';
  }

  // Handle object types
  if (schema.type === 'object' || schema.properties) {
    const props: string[] = [];

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const propSchema = prop as any;
        const optional = !schema.required?.includes(key);
        const description = propSchema.description;

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
  if (schema.enum) {
    return schema.enum.map((v: any) => JSON.stringify(v)).join(' | ');
  }

  // Handle union types (oneOf, anyOf)
  if (schema.oneOf || schema.anyOf) {
    const variants = schema.oneOf || schema.anyOf;
    return variants.map((s: any) => formatSchema(s, indent)).join(' | ');
  }

  // Handle primitive types
  switch (schema.type) {
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
function generateExampleBody(schema: any): any {
  if (!schema) return {};

  if (schema.$ref) {
    // Can't generate example from $ref without dereferencing
    return {};
  }

  if (schema.type === 'object' || schema.properties) {
    const example: any = {};

    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        const propSchema = prop as any;
        example[key] = generateExampleValue(propSchema);
      }
    }

    return example;
  }

  return generateExampleValue(schema);
}

/**
 * Generate example value for a schema property
 */
function generateExampleValue(schema: any): any {
  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.enum) {
    return schema.enum[0];
  }

  if (schema.type === 'array') {
    return schema.items ? [generateExampleValue(schema.items)] : [];
  }

  if (schema.type === 'object' || schema.properties) {
    return generateExampleBody(schema);
  }

  switch (schema.type) {
    case 'string':
      return schema.format === 'date-time' ? '2025-01-01T00:00:00Z' : 'string';
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
