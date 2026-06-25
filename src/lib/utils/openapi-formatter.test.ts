import { describe, it, expect } from 'vitest';
import {
  parseOpenAPISpec,
  filterEndpointsByPath,
  formatSchema,
  generateCurlExample,
  generateTypeScriptExample,
  type OpenAPIEndpoint,
} from './openapi-formatter.ts';

/**
 * Helper to build a minimal endpoint object for the generator/filter tests.
 */
function makeEndpoint(overrides: Partial<OpenAPIEndpoint> = {}): OpenAPIEndpoint {
  return {
    method: 'GET',
    path: '/things',
    summary: 'List things',
    responses: {},
    ...overrides,
  };
}

describe('parseOpenAPISpec', () => {
  it('parses a minimal valid OpenAPI 3 spec with GET and POST', () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/sessions': {
          get: {
            summary: 'List sessions',
            description: 'Returns all sessions',
            tags: ['Sessions'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                required: false,
                description: 'Max results',
                schema: { type: 'integer' },
              },
            ],
            responses: {
              '200': {
                description: 'A list of sessions',
                content: {
                  'application/json': {
                    schema: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          post: {
            summary: 'Create session',
            tags: ['Sessions'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { name: { type: 'string' } },
                    required: ['name'],
                  },
                },
              },
            },
            responses: {
              '201': { description: 'Created' },
            },
          },
        },
      },
    };

    const endpoints = parseOpenAPISpec(spec);

    expect(endpoints).toHaveLength(2);

    // Methods are emitted in fixed order: get before post.
    const get = endpoints[0];
    expect(get.method).toBe('GET');
    expect(get.path).toBe('/sessions');
    expect(get.summary).toBe('List sessions');
    expect(get.description).toBe('Returns all sessions');
    expect(get.tags).toEqual(['Sessions']);
    expect(get.parameters).toEqual([
      {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Max results',
        schema: { type: 'integer' },
      },
    ]);
    expect(get.responses['200'].description).toBe('A list of sessions');
    expect(get.responses['200'].schema).toEqual({ type: 'array', items: { type: 'string' } });
    // GET has no request body in this spec.
    expect(get.requestBody).toBeUndefined();

    const post = endpoints[1];
    expect(post.method).toBe('POST');
    expect(post.path).toBe('/sessions');
    expect(post.summary).toBe('Create session');
    expect(post.requestBody).toEqual({
      schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      required: true,
    });
    // 201 response with no content -> schema is undefined, description preserved.
    expect(post.responses['201'].description).toBe('Created');
    expect(post.responses['201'].schema).toBeUndefined();
  });

  it('uppercases all supported HTTP methods on a single path', () => {
    const spec = {
      paths: {
        '/widget': {
          get: { responses: {} },
          post: { responses: {} },
          put: { responses: {} },
          delete: { responses: {} },
          patch: { responses: {} },
        },
      },
    };

    const methods = parseOpenAPISpec(spec).map((e) => e.method);
    expect(methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  });

  it('defaults summary to empty string when missing', () => {
    const spec = { paths: { '/x': { get: { responses: {} } } } };
    const [endpoint] = parseOpenAPISpec(spec);
    expect(endpoint.summary).toBe('');
  });

  it('defaults response description to empty string when missing', () => {
    const spec = {
      paths: { '/x': { get: { responses: { '204': {} } } } },
    };
    const [endpoint] = parseOpenAPISpec(spec);
    expect(endpoint.responses['204']).toEqual({ description: '', schema: undefined });
  });

  it('omits requestBody when there is no application/json schema', () => {
    const spec = {
      paths: {
        '/upload': {
          post: {
            requestBody: {
              required: true,
              content: { 'text/plain': { schema: { type: 'string' } } },
            },
            responses: {},
          },
        },
      },
    };
    const [endpoint] = parseOpenAPISpec(spec);
    expect(endpoint.requestBody).toBeUndefined();
  });

  it('does not set parameters when none are provided', () => {
    const spec = { paths: { '/x': { get: { responses: {} } } } };
    const [endpoint] = parseOpenAPISpec(spec);
    expect(endpoint.parameters).toBeUndefined();
  });

  it('ignores non-HTTP-method keys on a path item', () => {
    const spec = {
      paths: {
        '/x': {
          parameters: [{ name: 'shared', in: 'query' }],
          summary: 'path-level summary',
          get: { responses: {} },
        },
      },
    };
    const endpoints = parseOpenAPISpec(spec);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].method).toBe('GET');
  });

  it('returns an empty array for null, undefined, and primitive input', () => {
    expect(parseOpenAPISpec(null)).toEqual([]);
    expect(parseOpenAPISpec(undefined)).toEqual([]);
    expect(parseOpenAPISpec('not a spec')).toEqual([]);
    expect(parseOpenAPISpec(42)).toEqual([]);
  });

  it('returns an empty array when paths is missing', () => {
    expect(parseOpenAPISpec({ openapi: '3.0.0' })).toEqual([]);
  });

  it('returns an empty array when paths is not an object', () => {
    expect(parseOpenAPISpec({ paths: 'nope' })).toEqual([]);
    expect(parseOpenAPISpec({ paths: null })).toEqual([]);
  });

  it('returns an empty array for an empty paths object (no throw)', () => {
    expect(parseOpenAPISpec({ paths: {} })).toEqual([]);
  });
});

describe('filterEndpointsByPath', () => {
  const endpoints = [
    makeEndpoint({ path: '/sessions' }),
    makeEndpoint({ path: '/sessions/{id}' }),
    makeEndpoint({ path: '/sessions-archive' }),
    makeEndpoint({ path: '/workflows' }),
  ];

  it('returns all endpoints for an empty filter', () => {
    expect(filterEndpointsByPath(endpoints, '')).toEqual(endpoints);
  });

  it('returns all endpoints for the wildcard "*"', () => {
    expect(filterEndpointsByPath(endpoints, '*')).toEqual(endpoints);
  });

  it('matches an exact path', () => {
    const result = filterEndpointsByPath(endpoints, '/workflows');
    expect(result.map((e) => e.path)).toEqual(['/workflows']);
  });

  it('matches a prefix including parameterized sub-paths', () => {
    const result = filterEndpointsByPath(endpoints, '/sessions');
    // Exact "/sessions" and the "/sessions/{id}" sub-path match;
    // "/sessions-archive" does NOT (it is not a slash-delimited sub-path).
    expect(result.map((e) => e.path)).toEqual(['/sessions', '/sessions/{id}']);
  });

  it('normalizes leading/trailing slashes in both filter and path', () => {
    const result = filterEndpointsByPath(endpoints, 'workflows');
    expect(result.map((e) => e.path)).toEqual(['/workflows']);
  });

  it('matches a brace-delimited sub-path directly appended to the filter', () => {
    const braced = [makeEndpoint({ path: '/items{id}' })];
    const result = filterEndpointsByPath(braced, '/items');
    expect(result.map((e) => e.path)).toEqual(['/items{id}']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterEndpointsByPath(endpoints, '/nope')).toEqual([]);
  });
});

describe('formatSchema', () => {
  it('returns "any" for falsy schema', () => {
    expect(formatSchema(undefined)).toBe('any');
    expect(formatSchema(null)).toBe('any');
    expect(formatSchema(0)).toBe('any');
    expect(formatSchema('')).toBe('any');
  });

  it('formats primitive types', () => {
    expect(formatSchema({ type: 'string' })).toBe('string');
    expect(formatSchema({ type: 'number' })).toBe('number');
    expect(formatSchema({ type: 'integer' })).toBe('number');
    expect(formatSchema({ type: 'boolean' })).toBe('boolean');
    expect(formatSchema({ type: 'null' })).toBe('null');
  });

  it('falls back to "any" for an unknown or typeless schema', () => {
    expect(formatSchema({ type: 'weird' })).toBe('any');
    expect(formatSchema({ description: 'no type here' })).toBe('any');
  });

  it('resolves a $ref to its final path segment', () => {
    expect(formatSchema({ $ref: '#/components/schemas/Session' })).toBe('Session');
  });

  it('prefers $ref over other schema keywords', () => {
    expect(formatSchema({ $ref: '#/components/schemas/User', type: 'object' })).toBe('User');
  });

  it('formats arrays of primitives', () => {
    expect(formatSchema({ type: 'array', items: { type: 'string' } })).toBe('string[]');
  });

  it('formats arrays without items as any[]', () => {
    expect(formatSchema({ type: 'array' })).toBe('any[]');
  });

  it('formats arrays of $ref items', () => {
    expect(formatSchema({ type: 'array', items: { $ref: '#/components/schemas/Item' } })).toBe(
      'Item[]'
    );
  });

  it('formats an object with required and optional properties', () => {
    const result = formatSchema({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['id'],
    });

    expect(result).toBe('{\n  id: string;\n  name?: string;\n}');
  });

  it('includes property descriptions as JSDoc comments', () => {
    const result = formatSchema({
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique identifier' },
      },
      required: ['id'],
    });

    expect(result).toBe('{\n  /** Unique identifier */\n  id: string;\n}');
  });

  it('formats nested objects with cumulative indentation', () => {
    const result = formatSchema({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      required: ['user'],
    });

    expect(result).toBe('{\n  user: {\n    name: string;\n  };\n}');
  });

  it('treats a property bag without explicit type as an object', () => {
    const result = formatSchema({
      properties: { flag: { type: 'boolean' } },
    });
    expect(result).toBe('{\n  flag?: boolean;\n}');
  });

  it('returns Record<string, any> for an object with no properties', () => {
    expect(formatSchema({ type: 'object' })).toBe('Record<string, any>');
    expect(formatSchema({ type: 'object', properties: {} })).toBe('Record<string, any>');
  });

  it('formats enum values as a string-literal union', () => {
    expect(formatSchema({ enum: ['active', 'inactive'] })).toBe('"active" | "inactive"');
  });

  it('formats numeric enum values', () => {
    expect(formatSchema({ enum: [1, 2, 3] })).toBe('1 | 2 | 3');
  });

  it('formats oneOf as a union', () => {
    expect(formatSchema({ oneOf: [{ type: 'string' }, { type: 'number' }] })).toBe(
      'string | number'
    );
  });

  it('formats anyOf as a union', () => {
    expect(formatSchema({ anyOf: [{ type: 'boolean' }, { type: 'null' }] })).toBe('boolean | null');
  });

  it('respects an explicit indent offset on objects', () => {
    const result = formatSchema({ type: 'object', properties: { a: { type: 'string' } } }, 1);
    // Properties indent one level deeper than the offset; the closing brace
    // sits at the offset level.
    expect(result).toBe('{\n    a?: string;\n  }');
  });
});

describe('generateCurlExample', () => {
  it('builds a GET curl command with the default base URL and JSON header', () => {
    const result = generateCurlExample(makeEndpoint({ method: 'GET', path: '/health' }));
    expect(result).toBe(`curl -X GET '/api/health' \\\n  -H 'Content-Type: application/json'`);
  });

  it('uses a custom base URL', () => {
    const result = generateCurlExample(
      makeEndpoint({ method: 'GET', path: '/health' }),
      'https://example.com'
    );
    expect(result).toContain(`curl -X GET 'https://example.com/health'`);
  });

  it('adds an Authorization header for Sessions-tagged endpoints', () => {
    const result = generateCurlExample(
      makeEndpoint({ method: 'GET', path: '/sessions', tags: ['Sessions'] })
    );
    expect(result).toContain(`-H 'Authorization: Bearer YOUR_API_KEY'`);
  });

  it('adds an Authorization header for Workflows-tagged endpoints', () => {
    const result = generateCurlExample(
      makeEndpoint({ method: 'GET', path: '/workflows', tags: ['Workflows'] })
    );
    expect(result).toContain(`-H 'Authorization: Bearer YOUR_API_KEY'`);
  });

  it('omits the Authorization header for untagged endpoints', () => {
    const result = generateCurlExample(makeEndpoint({ method: 'GET', path: '/public' }));
    expect(result).not.toContain('Authorization');
  });

  it('includes a generated request body for POST with a schema', () => {
    const result = generateCurlExample(
      makeEndpoint({
        method: 'POST',
        path: '/sessions',
        requestBody: {
          schema: {
            type: 'object',
            properties: { name: { type: 'string' }, count: { type: 'integer' } },
          },
        },
      })
    );

    expect(result).toContain(`curl -X POST '/api/sessions'`);
    expect(result).toContain('-d ');
    // Example values come from the schema's primitive defaults.
    expect(result).toContain('"name": "string"');
    expect(result).toContain('"count": 0');
  });

  it('does not include a body for GET even when a requestBody is present', () => {
    const result = generateCurlExample(
      makeEndpoint({
        method: 'GET',
        path: '/sessions',
        requestBody: { schema: { type: 'object', properties: { a: { type: 'string' } } } },
      })
    );
    expect(result).not.toContain('-d ');
  });

  it('prefers an explicit example value from the schema', () => {
    const result = generateCurlExample(
      makeEndpoint({
        method: 'POST',
        path: '/things',
        requestBody: {
          schema: { type: 'object', properties: { title: { type: 'string', example: 'Hello' } } },
        },
      })
    );
    expect(result).toContain('"title": "Hello"');
  });

  it('emits date-time strings for date-time formatted fields', () => {
    const result = generateCurlExample(
      makeEndpoint({
        method: 'POST',
        path: '/events',
        requestBody: {
          schema: { type: 'object', properties: { at: { type: 'string', format: 'date-time' } } },
        },
      })
    );
    expect(result).toContain('"at": "2025-01-01T00:00:00Z"');
  });
});

describe('generateTypeScriptExample', () => {
  it('emits a fetch call with method and headers for a simple GET', () => {
    const result = generateTypeScriptExample(makeEndpoint({ method: 'GET', path: '/health' }));

    expect(result).toContain(`const response = await fetch('/health', {`);
    expect(result).toContain(`method: 'GET',`);
    expect(result).toContain(`'Content-Type': 'application/json',`);
    expect(result).toContain(`'Authorization': 'Bearer YOUR_API_KEY',`);
    expect(result).toContain('const data: Response = await response.json();');
    // No request body and no success-response schema -> no interface blocks.
    expect(result).not.toContain('interface RequestBody');
    expect(result).not.toContain('interface Response {');
  });

  it('emits a RequestBody interface for an object request body', () => {
    const result = generateTypeScriptExample(
      makeEndpoint({
        method: 'POST',
        path: '/sessions',
        requestBody: {
          schema: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
        },
      })
    );

    expect(result).toContain('interface RequestBody {');
    // The object body fields are inlined (outer braces stripped).
    expect(result).toContain('name: string;');
    // Body is serialized into the fetch call for POST.
    expect(result).toContain('body: JSON.stringify(');
  });

  it('wraps a non-object request body schema in a body field', () => {
    const result = generateTypeScriptExample(
      makeEndpoint({
        method: 'POST',
        path: '/raw',
        requestBody: { schema: { type: 'string' } },
      })
    );
    expect(result).toContain('interface RequestBody {');
    expect(result).toContain('  body: string;');
  });

  it('emits a Response interface from a 200 response schema', () => {
    const result = generateTypeScriptExample(
      makeEndpoint({
        method: 'GET',
        path: '/sessions',
        responses: {
          '200': {
            description: 'ok',
            schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
          },
        },
      })
    );

    expect(result).toContain('interface Response {');
    expect(result).toContain('id: string;');
  });

  it('falls back to the 201 response schema when 200 is absent', () => {
    const result = generateTypeScriptExample(
      makeEndpoint({
        method: 'POST',
        path: '/sessions',
        responses: {
          '201': {
            description: 'created',
            schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
          },
        },
      })
    );
    expect(result).toContain('interface Response {');
    expect(result).toContain('id: string;');
  });

  it('wraps a non-object response schema in a data field', () => {
    const result = generateTypeScriptExample(
      makeEndpoint({
        method: 'GET',
        path: '/count',
        responses: { '200': { description: 'ok', schema: { type: 'number' } } },
      })
    );
    expect(result).toContain('interface Response {');
    expect(result).toContain('  data: number;');
  });

  it('does not serialize a body into the fetch call for GET requests', () => {
    const result = generateTypeScriptExample(
      makeEndpoint({
        method: 'GET',
        path: '/sessions',
        requestBody: { schema: { type: 'object', properties: { a: { type: 'string' } } } },
      })
    );
    // The interface is still declared, but no body is sent on a GET.
    expect(result).toContain('interface RequestBody {');
    expect(result).not.toContain('body: JSON.stringify(');
  });
});
