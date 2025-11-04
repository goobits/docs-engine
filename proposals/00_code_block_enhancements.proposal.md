# Code Block Enhancements

## Problem

Code blocks in docs-engine lack standard features that developers expect from modern documentation tools:
- No copy-to-clipboard button
- No line number support
- No line highlighting (`{1,3-5}` syntax)
- No file titles/labels
- No diff syntax support (added/removed lines)

This creates friction for users copying code examples and makes it harder to reference specific lines in documentation.

## Solution

Enhance the code highlighting plugin to support:

1. **Copy Button**: Add click-to-copy functionality to all code blocks
2. **Line Numbers**: Optional line numbers with `showLineNumbers` flag
3. **Line Highlighting**: Support `{1,3-5}` syntax to highlight specific lines
4. **File Titles**: Support `title="filename.ts"` metadata
5. **Diff Syntax**: Support `diff` language with `+`/`-` prefixes for added/removed lines

## Checklists

### Core Implementation
- [ ] Update `codeHighlightPlugin` to parse metadata from code fence info string
- [ ] Add metadata parser for title, line numbers, and highlight ranges
- [ ] Extend Shiki transformer to apply line highlighting classes
- [ ] Create `CodeBlock.svelte` component with copy button
- [ ] Add line number rendering option
- [ ] Implement copy-to-clipboard functionality with visual feedback

### Diff Support
- [ ] Add diff language support to Shiki configuration
- [ ] Style `+` prefixed lines (additions) with green background
- [ ] Style `-` prefixed lines (deletions) with red background
- [ ] Handle diff syntax in line number display

### Styling
- [ ] Add CSS variables for code block chrome (title bar, copy button)
- [ ] Style line highlighting backgrounds
- [ ] Style line numbers
- [ ] Add copy button hover states and animations
- [ ] Ensure styles work in dark mode

### Documentation
- [ ] Document syntax in README.md
- [ ] Add examples to docs/CODE_BLOCKS.md
- [ ] Show line highlighting examples
- [ ] Show diff examples
- [ ] Document copy button customization

## Success Criteria

- Code blocks support all metadata syntax: ` ```typescript title="app.ts" {1,3-5} showLineNumbers `
- Copy button appears on all code blocks and copies code without line numbers
- Line highlighting renders with distinct background color
- Diff syntax renders with proper colors for additions/removals
- File titles appear above code blocks in a styled header
- Feature parity with Docusaurus/VitePress code blocks

## Benefits

- Improved developer experience when copying code examples
- Better code reference capabilities with line numbers and highlighting
- Professional appearance matching industry-standard documentation tools
- Easier to explain code changes with diff syntax
- Reduced friction for users adopting docs-engine
