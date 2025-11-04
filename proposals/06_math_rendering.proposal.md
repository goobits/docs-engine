# Math Rendering with KaTeX

## Problem

Technical, scientific, and academic documentation cannot render mathematical equations. Users writing documentation for:
- Scientific software
- Machine learning libraries
- Mathematical algorithms
- Engineering tools
- Academic research

...must use images for equations or link to external resources. Competitors (VitePress, Docusaurus) support math rendering via KaTeX or MathJax.

## Solution

Add KaTeX plugin for rendering LaTeX-style mathematical equations in markdown.

**Syntax:**
```markdown
Inline math: $E = mc^2$

Block math:
$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

## Checklists

### Plugin Implementation
- [ ] Create `src/lib/plugins/katex.ts` remark plugin
- [ ] Detect inline math blocks (single `$`)
- [ ] Detect display math blocks (double `$$`)
- [ ] Parse LaTeX expressions between delimiters
- [ ] Transform to KaTeX HTML via `katex.renderToString()`
- [ ] Handle parsing errors gracefully (show error message, don't break build)
- [ ] Escape HTML in error messages

### Styling
- [ ] Import KaTeX CSS in docs-engine styles
- [ ] Add dark mode support for equations
- [ ] Ensure equations are responsive
- [ ] Style display equations (centered, spacing)
- [ ] Style inline equations (baseline alignment)

### Configuration
- [ ] Add plugin options for KaTeX config
- [ ] Support `strict` mode (throw on errors vs. show error)
- [ ] Support `trust` option (allow `\href` and other macros)
- [ ] Support custom macros via config
- [ ] Support `displayMode` override

### Hydration
- [ ] Math renders server-side (no hydration needed)
- [ ] Ensure no layout shift on client load
- [ ] Test with SSR

### Examples & Testing
- [ ] Test inline equations in paragraphs
- [ ] Test display equations (centered blocks)
- [ ] Test complex equations (matrices, integrals, summations)
- [ ] Test equation arrays
- [ ] Test error handling (invalid LaTeX)
- [ ] Test special characters and escaping

### Documentation
- [ ] Add `docs/MATH.md` documentation
- [ ] Show inline and display equation syntax
- [ ] Provide common equation examples
- [ ] Document KaTeX options
- [ ] Link to KaTeX supported functions
- [ ] Show error handling behavior
- [ ] Update main README with math rendering feature

### Dependencies
- [ ] Add `katex` as dependency
- [ ] Add `rehype-katex` or build custom plugin
- [ ] Add `remark-math` for parsing math syntax
- [ ] Ensure peer dependencies are documented

## Success Criteria

- Inline math ($...$) renders correctly in paragraphs
- Display math ($$...$$) renders as centered blocks
- Complex equations (matrices, fractions, integrals) render properly
- Math renders server-side (no flash of unstyled content)
- Syntax errors show helpful error messages without breaking builds
- Dark mode styling works correctly
- Math is accessible (aria-labels, alt text)
- Feature parity with VitePress math support

## Benefits

- Enables scientific and mathematical documentation
- Opens docs-engine to academic and research communities
- Supports machine learning and data science library documentation
- Professional equation rendering without images
- Server-side rendering improves performance
- Low complexity, high value feature
- Matches feature set of competing documentation tools
