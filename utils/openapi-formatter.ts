/**
 * OpenAPI Formatter Utilities
 *
 * Provides functions to parse and format OpenAPI specifications
 */

export interface OpenAPIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: any;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  schema: any;
}

export interface OpenAPIResponse {
  description: string;
  schema?: any;
}

export interface OpenAPIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
}

/**
 * Parse OpenAPI specification into structured endpoints
 */
export function parseOpenAPISpec(spec: any): OpenAPIEndpoint[] {
  const endpoints: OpenAPIEndpoint[] = [];

  if (!spec.paths) {
    return endpoints;
  }

  for (const [path, pathItem] of Object.entries(spec.paths as Record<string, any>)) {
    for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        const endpoint: OpenAPIEndpoint = {
          path,
          method: method.toUpperCase(),
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters,
          requestBody: operation.requestBody
            ? {
                description: operation.requestBody.description,
                required: operation.requestBody.required,
                schema: operation.requestBody.content?.['application/json']?.schema,
              }
            : undefined,
          responses: {},
        };

        // Parse responses
        if (operation.responses) {
          for (const [statusCode, response] of Object.entries(
            operation.responses as Record<string, any>
          )) {
            endpoint.responses[statusCode] = {
              description: response.description || '',
              schema: response.content?.['application/json']?.schema,
            };
          }
        }

        endpoints.push(endpoint);
      }
    }
  }

  return endpoints;
}

/**
 * Filter endpoints by path pattern
 */
export function filterEndpointsByPath(
  endpoints: OpenAPIEndpoint[],
  pathFilter: string
): OpenAPIEndpoint[] {
  if (!pathFilter || pathFilter === '*') {
    return endpoints;
  }

  return endpoints.filter((endpoint) => {
    return endpoint.path.includes(pathFilter);
  });
}

/**
 * Format schema object into readable string
 */
export function formatSchema(schema: any): string {
  if (!schema) {
    return 'any';
  }

  if (typeof schema === 'string') {
    return schema;
  }

  if (schema.type === 'array') {
    const itemType = formatSchema(schema.items);
    return `${itemType}[]`;
  }

  if (schema.type === 'object' || schema.properties) {
    const props = schema.properties || {};
    const formatted = Object.entries(props)
      .map(([key, value]: [string, any]) => {
        const required = schema.required?.includes(key) ? '' : '?';
        return `  ${key}${required}: ${formatSchema(value)}`;
      })
      .join('\n');

    return `{\n${formatted}\n}`;
  }

  if (schema.$ref) {
    // Extract schema name from $ref
    const parts = schema.$ref.split('/');
    return parts[parts.length - 1];
  }

  if (schema.enum) {
    return schema.enum.map((v: any) => `"${v}"`).join(' | ');
  }

  return schema.type || 'any';
}

/**
 * Generate cURL example for an endpoint
 */
export function generateCurlExample(endpoint: OpenAPIEndpoint, baseUrl: string): string {
  const url = `${baseUrl}${endpoint.path}`;
  let curl = `curl -X ${endpoint.method} "${url}"`;

  // Add headers
  curl += ' \\\n  -H "Content-Type: application/json"';

  // Add request body if present
  if (endpoint.requestBody?.schema) {
    const exampleBody = generateExampleFromSchema(endpoint.requestBody.schema);
    curl += ` \\\n  -d '${JSON.stringify(exampleBody, null, 2)}'`;
  }

  return curl;
}

/**
 * Generate TypeScript example for an endpoint
 */
export function generateTypeScriptExample(endpoint: OpenAPIEndpoint): string {
  let code = `// ${endpoint.summary || endpoint.path}\n`;

  // Generate type for request body
  if (endpoint.requestBody?.schema) {
    code += `interface RequestBody ${formatSchema(endpoint.requestBody.schema)}\n\n`;
  }

  // Generate type for response
  const successResponse = endpoint.responses['200'] || endpoint.responses['201'];
  if (successResponse?.schema) {
    code += `interface Response ${formatSchema(successResponse.schema)}\n\n`;
  }

  // Generate fetch example
  code += `const response = await fetch('${endpoint.path}', {\n`;
  code += `  method: '${endpoint.method}',\n`;
  code += `  headers: { 'Content-Type': 'application/json' },\n`;

  if (endpoint.requestBody) {
    code += `  body: JSON.stringify(requestBody)\n`;
  }

  code += `});\n\n`;
  code += `const data = await response.json();`;

  return code;
}

/**
 * Generate example data from schema
 */
function generateExampleFromSchema(schema: any): any {
  if (!schema) {
    return null;
  }

  if (schema.example) {
    return schema.example;
  }

  if (schema.type === 'string') {
    return 'string';
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return 0;
  }

  if (schema.type === 'boolean') {
    return false;
  }

  if (schema.type === 'array') {
    return [generateExampleFromSchema(schema.items)];
  }

  if (schema.type === 'object' || schema.properties) {
    const obj: any = {};
    for (const [key, value] of Object.entries(schema.properties || {})) {
      obj[key] = generateExampleFromSchema(value);
    }
    return obj;
  }

  return null;
}
