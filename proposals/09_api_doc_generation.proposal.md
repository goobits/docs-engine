# API Documentation Generator

## Problem

Library authors must manually write and maintain API reference documentation. This is:
- Time-consuming and error-prone
- Gets out of sync with code changes
- Requires duplicating information from JSDoc/TypeScript
- Tedious to keep updated

TypeScript projects already have type information and JSDoc comments. This should auto-generate API documentation.

## Solution

Build tool that parses TypeScript source files and auto-generates markdown API reference pages from JSDoc comments, types, and signatures.

**Input (TypeScript):**
```typescript
/**
 * Parse YAML frontmatter from markdown files
 * @param markdown - Markdown content with frontmatter
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(markdown: string): ParsedContent
```

**Output (Markdown):**
```markdown
## parseFrontmatter(markdown)

Parse YAML frontmatter from markdown files.

**Parameters:**
- `markdown` (string) - Markdown content with frontmatter

**Returns:** ParsedContent
```

## Checklists

### Core Parser
- [ ] Use `typescript` or `ts-morph` for AST parsing
- [ ] Extract exported functions, classes, interfaces, types
- [ ] Parse JSDoc comments (@param, @returns, @example, @deprecated)
- [ ] Extract type signatures and generics
- [ ] Handle method overloads
- [ ] Support type aliases and unions
- [ ] Extract enums with values

### Markdown Generator
- [ ] Create `src/lib/generators/api-docs.ts`
- [ ] Generate function documentation with signature
- [ ] Generate class documentation with methods and properties
- [ ] Generate interface documentation with properties
- [ ] Generate type alias documentation
- [ ] Generate enum documentation
- [ ] Link types to their definitions
- [ ] Preserve JSDoc formatting (code blocks, lists)

### CLI Command
- [ ] Add `docs-engine generate-api` command
- [ ] Accept source directory path
- [ ] Accept output directory path
- [ ] Support glob patterns for files to include
- [ ] Support exclude patterns
- [ ] Generate navigation structure for API docs
- [ ] Watch mode for development (regenerate on changes)

### Type Linking
- [ ] Detect type references in signatures
- [ ] Generate links to type definitions
- [ ] Handle external types (from dependencies)
- [ ] Link to official docs for built-in types
- [ ] Support custom type link mappings

### Grouping & Organization
- [ ] Group by module/file
- [ ] Support custom grouping via JSDoc @category tag
- [ ] Generate index pages for groups
- [ ] Alphabetical sorting within groups
- [ ] Support custom ordering via config

### Examples
- [ ] Extract @example JSDoc blocks
- [ ] Syntax highlight example code
- [ ] Support multiple examples per function
- [ ] Auto-generate usage examples from types

### Metadata
- [ ] Extract @deprecated with migration notes
- [ ] Extract @since version information
- [ ] Extract @experimental flags
- [ ] Support custom JSDoc tags
- [ ] Generate "Added in" / "Deprecated in" badges

### Configuration
- [ ] Add `apiDocsConfig` to docs-engine config
- [ ] Support `entryPoints` (files to parse)
- [ ] Support `outputDir` (where to write markdown)
- [ ] Support `exclude` patterns
- [ ] Support `typeLinks` (custom type URL mappings)
- [ ] Support `grouping` strategy

### Integration
- [ ] Auto-generate API docs on build
- [ ] Include in navigation structure
- [ ] Support manual and auto-generated docs together
- [ ] Hot reload in dev mode when source changes

### Templates
- [ ] Create customizable markdown templates
- [ ] Support custom function template
- [ ] Support custom class template
- [ ] Support custom interface template
- [ ] Allow injecting custom sections

### Documentation
- [ ] Document API doc generation in README.md
- [ ] Document JSDoc best practices
- [ ] Document supported JSDoc tags
- [ ] Document type linking configuration
- [ ] Show before/after examples
- [ ] Document integration with manual docs

## Success Criteria

- Parses TypeScript files and extracts API information
- Generates readable markdown API reference pages
- Types link to their definitions
- JSDoc comments are preserved and formatted
- Examples are syntax highlighted
- Deprecated APIs show warnings
- Generated docs match hand-written quality
- Regenerates automatically in dev mode
- Works with complex TypeScript (generics, overloads, unions)

## Benefits

- Eliminates manual API documentation maintenance
- Docs always in sync with source code
- Reduces documentation effort by 80% for API references
- Encourages better JSDoc comments
- Professional API reference without manual work
- Type-safe documentation (TypeScript validates)
- Unique selling point (Svelte + TypeScript native)
- Major time saver for library authors
