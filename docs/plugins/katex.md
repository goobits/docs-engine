---
title: KaTeX Math Plugin
description: Render mathematical equations with LaTeX syntax using KaTeX
section: Plugins
difficulty: intermediate
tags: [plugin, math, latex, katex, equations]
---

# KaTeX Math Plugin

Render beautiful mathematical equations with LaTeX syntax using KaTeX.

## Quick Start

### Install Dependencies

```bash
npm install katex remark-math
```

### Add to MDSveX Config

`````markdown
````tabs:katex-config
tab: JavaScript
---
```javascript
import remarkMath from 'remark-math';
import { katexPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        remarkMath,        // Parse math syntax
        katexPlugin(),     // Render with KaTeX
      ],
    }),
  ],
};
```
---
tab: TypeScript
---
```typescript
import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import { katexPlugin } from '@goobits/docs-engine/plugins';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        remarkMath,
        katexPlugin(),
      ],
    }),
  ],
};

export default config;
```
````
`````

### Import KaTeX CSS

```svelte
<!-- In your root layout -->
<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
</svelte:head>
```

### Use in Markdown

```markdown
Inline math: $E = mc^2$

Display math (centered):
$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

---

## Syntax

### Inline Math

Use single dollar signs for inline equations:

```markdown
The equation $E = mc^2$ shows mass-energy equivalence.
```

The equation $E = mc^2$ shows mass-energy equivalence.

### Display Math (Block)

Use double dollar signs for centered block equations:

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

---

## Examples

### Basic Equations

**Quadratic formula:**

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

**Pythagorean theorem:**

The relationship $a^2 + b^2 = c^2$ holds for right triangles.

### Calculus

**Derivative definition:**

$$
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
$$

**Fundamental theorem of calculus:**

$$
\int_a^b f(x) dx = F(b) - F(a)
$$

### Linear Algebra

**Matrix multiplication:**

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

### Statistics

**Normal distribution:**

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

**Bayes' theorem:**

$$
P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}
$$

---

## Configuration

### Custom Macros

Define reusable LaTeX macros:

```javascript
katexPlugin({
  macros: {
    "\\RR": "\\mathbb{R}",
    "\\NN": "\\mathbb{N}",
    "\\ZZ": "\\mathbb{Z}",
    "\\CC": "\\mathbb{C}"
  }
})
```

Now use them in markdown:

```markdown
The real numbers $\RR$ and natural numbers $\NN$.
```

### Error Handling

Control how LaTeX errors are displayed:

```javascript
katexPlugin({
  strict: false,        // Don't throw on errors
  errorColor: '#cc0000' // Color for error messages
})
```

### Trust Mode

Enable advanced LaTeX commands:

```javascript
katexPlugin({
  trust: true  // Allows \url, \href, and other commands
})
```

---

## Common Use Cases

### Documentation Examples

:::tabs
```markdown
**Algorithm complexity:**
The algorithm runs in $O(n \log n)$ time.
```

```markdown
**Performance metrics:**
Average response time: $\mu = 125ms, \sigma = 23ms$
```
:::

### Code Documentation

Document mathematical aspects of algorithms:

```typescript
/**
 * Calculate distance using Euclidean metric:
 * $$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
 */
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2)
  );
}
```

The Euclidean distance formula: $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$

### Scientific Documentation

For technical docs with formulas:

> **Note:** The Shannon entropy formula measures information content:
>
> $$
> H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)
> $$

---

## Advanced Features

### Multi-line Equations

```markdown
$$
\begin{aligned}
f(x) &= x^2 + 2x + 1 \\
     &= (x + 1)^2
\end{aligned}
$$
```

$$
\begin{aligned}
f(x) &= x^2 + 2x + 1 \\
     &= (x + 1)^2
\end{aligned}
$$

### Systems of Equations

```markdown
$$
\begin{cases}
x + y = 5 \\
2x - y = 1
\end{cases}
$$
```

$$
\begin{cases}
x + y = 5 \\
2x - y = 1
\end{cases}
$$

### Greek Letters & Symbols

Common symbols in technical documentation:

| Symbol | LaTeX | Rendered |
|--------|-------|----------|
| Alpha | `$\alpha$` | $\alpha$ |
| Beta | `$\beta$` | $\beta$ |
| Delta | `$\Delta$` | $\Delta$ |
| Infinity | `$\infty$` | $\infty$ |
| Sum | `$\sum_{i=1}^{n}$` | $\sum_{i=1}^{n}$ |
| Integral | `$\int_a^b$` | $\int_a^b$ |

---

## Plugin Order

> **Warning:** KaTeX plugin must run near the end, after `remarkMath`.

```javascript
remarkPlugins: [
  // Structural plugins first
  filetreePlugin(),
  calloutsPlugin(),

  // Content plugins
  linksPlugin(),
  referencePlugin(),

  // Math plugins (near end)
  remarkMath,      // ← Parse math first
  katexPlugin(),   // ← Render second

  // Code highlighting (last)
  codeHighlightPlugin(),
]
```

---

## Performance

**Build-time rendering:** KaTeX renders equations during build, not at runtime:

- ✅ No JavaScript required on client
- ✅ Fast page loads
- ✅ Works without JavaScript enabled
- ✅ SEO-friendly (rendered HTML)

**Bundle size:** ~150KB (CSS + fonts)

:::collapse{title="Optimization tips" open=false}

1. **Lazy load CSS** - Only load KaTeX CSS on pages with math
2. **Self-host fonts** - Download KaTeX fonts for faster loading
3. **Minify CSS** - Use production KaTeX CSS build
4. **Cache aggressively** - KaTeX output is stable

:::

---

## Troubleshooting

:::collapse{title="Math not rendering?"}

**Check these issues:**

1. **Missing `remark-math`** - Install: `npm install remark-math`
2. **Plugin order** - `remarkMath` must come before `katexPlugin()`
3. **Missing CSS** - Import KaTeX stylesheet in layout
4. **Invalid LaTeX** - Check browser console for syntax errors

:::

:::collapse{title="LaTeX syntax errors?"}

Common mistakes:

- **Backslashes** - Use `\\` for newlines, not `\n`
- **Braces** - Always match `{` with `}`
- **Dollar signs** - Escape literal dollars: `\$`
- **Underscores** - Escape outside math: `\_`

**Test your LaTeX:** Use [KaTeX demo](https://katex.org/) to validate syntax.

:::

:::collapse{title="Symbols not displaying?"}

**Causes:**
1. **Fonts not loaded** - Check KaTeX CSS is imported
2. **Font CDN blocked** - Self-host KaTeX fonts
3. **Unicode issues** - Ensure UTF-8 encoding

**Fix:** Import fonts explicitly:
```css
@import url('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/fonts/');
```

:::

---

## Best Practices

1. **Keep it simple** - Complex equations are hard to read
2. **Define variables** - Explain notation before using
3. **Use display math for key equations** - Makes them stand out
4. **Test thoroughly** - Preview math in multiple browsers
5. **Provide context** - Explain what equations represent
6. **Use macros for repetition** - Define common expressions once

---

## Comparison with Alternatives

| Feature | KaTeX | MathJax |
|---------|-------|---------|
| **Speed** | ⚡ Very fast | Slower |
| **Build-time** | ✅ Yes | ❌ Runtime only |
| **Bundle size** | ~150KB | ~350KB |
| **Browser support** | Modern | All browsers |
| **LaTeX coverage** | Most common | Complete |

> **Tip:** KaTeX is ideal for documentation sites. It's faster and lighter than MathJax.

---

## Related Documentation

**Prerequisites:** Basic LaTeX knowledge, understanding of mathematical notation

**Next Steps:**
- [Plugin Order](../guides/plugin-order.md) - Correct plugin configuration
- [Code Highlighting](./code-highlighting.md) - Syntax highlighting

**Related:**
- [KaTeX Documentation](https://katex.org/docs/) - Complete LaTeX reference
- [LaTeX Math Symbols](https://katex.org/docs/supported.html) - Supported commands
