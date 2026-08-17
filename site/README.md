# Docs Engine site

The bundled SvelteKit site exercises the same public adapter and components shipped to consumers. Its Markdown source is the repository `docs/` directory.

```bash
pnpm install
pnpm --filter site check
pnpm --filter site build
pnpm --filter site dev
```

The implementation intentionally stays thin:

- `src/routes/docs/_docsData.server.ts` creates the shared docs runtime.
- index, catch-all, layout, and search routes delegate to shared handlers.
- `src/lib/DocsPage.svelte` renders shared page data with `DocsLayout`.

Project-specific content and branding stay in this site. Rendering, navigation, search, and route plumbing belong to `@goobits/docs-engine`.
