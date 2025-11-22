# Contributing to docs-engine

Thank you for your interest in contributing to docs-engine! This guide will help you write documentation and code that matches our standards.

## Documentation Voice & Style

### Target Aesthetic
We're inspired by Apple aesthetics and Medium-style copywriting, with these principles:

- **Clean & Confident**: Apple-inspired minimalism—say what matters, nothing more
- **Conversational yet Authoritative**: Medium-style warmth without sacrificing precision
- **Concise**: Maximum information density, minimal word count
- **Honest**: No marketing speak, just facts

### Writing Guidelines

#### Voice Checklist
- ✅ **Use active voice**: "The plugin transforms markdown" not "Markdown is transformed by the plugin"
- ✅ **Short sentences**: Aim for 15-20 words per sentence
- ✅ **Show, don't tell**: Provide examples over long explanations
- ✅ **Be direct**: "You can" instead of "It is possible to"
- ✅ **One idea per paragraph**: Keep paragraphs focused and scannable

#### What to Avoid
- ❌ **Marketing language**: "Amazing!", "Revolutionary!", "Game-changing!"
- ❌ **Excessive adverbs**: "very", "extremely", "really"
- ❌ **Passive voice**: Unless absolutely necessary
- ❌ **Jargon without explanation**: Define technical terms on first use
- ❌ **Emojis**: Unless explicitly requested or in specific contexts

#### Tone Examples

**Before (Academic):**
```markdown
The docs-engine symbol reference system is deliberately split between
reusable package functionality and consumer-specific implementation.
This architecture enables any project to adopt the system while
maintaining flexibility for project-specific needs.
```

**After (Apple/Medium Style):**
```markdown
Everything in docs-engine falls into two categories: what we provide,
and what you build. This separation keeps the package lightweight while
giving you complete control over how your documentation discovers and
links symbols.
```

### Content Structure

#### Progressive Disclosure
Start simple, add complexity gradually:

1. **Quick Start**: Get running in 5 minutes
2. **Common Patterns**: Cover 80% of use cases
3. **Advanced Topics**: Deep dives for power users

#### Scannable Content
- Use headings liberally (H2 for major sections, H3 for subsections)
- Bullet points for lists, never long paragraphs
- Code examples should be self-contained and runnable
- Callouts for important notes, warnings, tips

#### Information Density
Each paragraph should contain new information. Ask:
- Does this sentence add value?
- Can I say this in fewer words?
- Is there a better example than an explanation?

## Link Formatting Convention

Always use relative paths with `.md` extension:

```markdown
✅ Good:
[Getting Started](./getting-started.md)
[API Docs](../reference/api.md#methods)
[Jump to Section](#overview)

❌ Avoid:
[Getting Started](getting-started)
[API Docs](/reference/api#methods)
```

### Link Guidelines
1. Always use relative paths from current file: `./sibling.md`, `../parent.md`
2. Always include .md extension for markdown files
3. Keep anchor IDs lowercase hyphenated: `#quick-start` not `#Quick Start`
4. Format: `[Link Text](../path/to/file.md#section-name)`

## Frontmatter Template

All documentation files should include YAML frontmatter:

```yaml
---
title: "Page Title"
description: "One-sentence summary for SEO"
section: "Guides|Plugins|Components|Utilities|Reference"
difficulty: "beginner|intermediate|advanced"
tags: ["tag1", "tag2", "tag3"]
order: 1  # Sort order within section
---
```

**Field Descriptions:**
- `title`: Displayed in navigation and page header
- `description`: Used for SEO and search results (keep under 160 chars)
- `section`: Category for organizing documentation
- `difficulty`: Helps users find appropriate content
- `tags`: Keywords for search and filtering
- `order`: Numeric sort order within the section

## Code Style

### Documentation Code Examples
- Use syntax highlighting: ` ```typescript ` or ` ```bash `
- Show complete, runnable examples
- Include comments for complex logic
- Test all code examples before committing

### TypeScript Guidelines
- Follow the existing code style
- Use TypeScript strict mode
- Document public APIs with JSDoc comments
- Export types and interfaces for library consumers

## File Organization

### Directory Structure
```
docs/
├── index.md                 # Documentation home
├── getting-started.md       # Quick start guide
├── guides/                  # Topic-specific guides
│   ├── architecture.md      # System architecture
│   ├── migration.md         # Upgrade guides
│   ├── examples.md          # Code examples
│   └── plugin-order.md      # Plugin configuration
├── plugins/                 # Plugin documentation
├── components/              # Component documentation
├── utilities/               # Utility documentation
└── reference/               # API reference docs
```

### Naming Conventions
- Use lowercase with hyphens: `getting-started.md`, `api-reference.md`
- Be descriptive but concise
- Match file names to page titles where possible

## Commit Guidelines

### Commit Message Format
```
type(scope): brief description

Longer explanation if needed. Wrap at 72 characters.

- Bullet points for multiple changes
- Reference issues: Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```bash
docs(guides): add architecture diagrams with mermaid

- Created comprehensive system overview diagram
- Added data flow sequence diagram
- Updated architecture guide with visual references

feat(plugins): add tocPlugin alias for consistency

The getting-started guide uses tocPlugin() but the actual export
was remarkTableOfContents. Added an alias export for better DX.

fix(styles): update symbol class names from symbol-ref to symbol

Updated CSS classes to match W3C semantic naming conventions.
This is a breaking change for v2.0.
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes following these guidelines
4. Test your changes locally
5. Commit with descriptive messages
6. Push to your fork
7. Open a pull request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Link to related issues

## Testing Documentation

Before submitting:
- [ ] All links work (no 404s)
- [ ] Code examples run successfully
- [ ] Frontmatter is complete and valid
- [ ] Voice matches Apple/Medium aesthetic
- [ ] Content is concise and scannable
- [ ] No spelling or grammar errors

## Questions?

If you're unsure about any of these guidelines:
- Open an issue for discussion
- Look at recent merged PRs for examples
- Ask in the community discussion

Thank you for contributing! 🙏
