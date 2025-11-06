---
title: API Reference
description: Complete API reference documentation
section: Reference
difficulty: intermediate
---

# API Reference

Complete API documentation for docs-engine, auto-generated from source code.

> **Note:** This section is under construction. API documentation will be auto-generated from JSDoc comments using our own API generation tools.

## Coming Soon

- **Plugins API** - All plugin interfaces and configuration options
- **Utilities API** - Helper functions and utilities
- **Server API** - Server-side utilities and endpoints
- **Components API** - Svelte component props and events
- **Configuration** - Complete configuration schema

## Documentation Generation

This documentation will be automatically generated from TypeScript source files using:

```typescript
import { parseApi, generateApiDocFile } from '@goobits/docs-engine/server';

const files = parseApi({
  entryPoints: ['src/lib/**/*.ts'],
  exclude: ['**/*.test.ts']
});
```

Stay tuned for automatically generated, always-up-to-date API documentation!
