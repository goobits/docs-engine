# create-docs-engine

Scaffold a new docs-engine documentation site with one command.

## Usage

```bash
npx create-docs-engine my-docs
cd my-docs
pnpm dev
```

## Features

- Interactive CLI prompts for project configuration
- Support for npm, pnpm, and yarn
- Optional features (screenshots, mermaid, git integration)
- Ready-to-run SvelteKit project with docs-engine configured
- Sample documentation files included

## Options

```bash
# Specify project name
npx create-docs-engine my-docs

# Interactive mode (will prompt for project name)
npx create-docs-engine
```

## What's Included

The generated project includes:

- `docs/` - Markdown documentation files
- `src/routes/` - SvelteKit routes
- Sample markdown files demonstrating features
- Configured package.json with scripts
- .gitignore file
- README.md

## Development

After creating a project:

```bash
cd my-docs
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm preview    # Preview production build
```

## License

MIT
