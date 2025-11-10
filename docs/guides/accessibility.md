---
title: Accessibility Guidelines
description: WCAG 2.1 compliance and accessibility best practices for docs-engine
section: Guides
difficulty: intermediate
tags: [accessibility, wcag, a11y, aria]
order: 6
---

# Accessibility Guidelines

docs-engine follows WCAG 2.1 Level AA standards to ensure documentation is accessible to all users.

## Core Principles

### Perceivable
Users must be able to perceive the information being presented.

**Color Contrast** - All text meets WCAG AAminimum ratios:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio

**Text Alternatives** - All non-text content has text alternatives:
- Code examples include language labels
- Diagrams include descriptive alt text
- Icons have ARIA labels

### Operable
Users must be able to operate the interface.

**Keyboard Navigation** - All interactive elements are keyboard accessible:
- Tab to focus links, buttons, form controls
- Enter/Space to activate buttons
- Arrow keys for navigation menus
- Esc to close modals/dropdowns

**Focus Indicators** - Visible focus indicators on all interactive elements:
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Understandable
Information and operation must be understandable.

**Clear Language** - Use plain language, define technical terms on first use
**Consistent Navigation** - Navigation structure remains consistent across pages
**Error Prevention** - Clear error messages with suggestions for correction

### Robust
Content must be robust enough to work with assistive technologies.

**Semantic HTML** - Use appropriate HTML elements:
- `<nav>` for navigation
- `<main>` for primary content
- `<article>` for self-contained content
- `<aside>` for complementary content
- `<h1>`-`<h6>` for heading hierarchy

## Component Accessibility

### ThemeToggle

```html
<button
  role="switch"
  aria-checked="false"
  aria-label="Switch to dark theme"
  title="Switch to dark theme"
>
  <svg aria-hidden="true"><!-- Icon --></svg>
</button>
```

### Navigation

```html
<nav aria-label="Documentation navigation">
  <ul>
    <li>
      <a href="/docs" aria-current="page">Getting Started</a>
    </li>
  </ul>
</nav>
```

### Code Blocks

```html
<div class="code-block" role="region" aria-label="Code example">
  <button aria-label="Copy code to clipboard">Copy</button>
  <pre><code>// Code here</code></pre>
</div>
```

## Testing Checklist

### Automated Testing
- [ ] Run axe DevTools browser extension
- [ ] Check WAVE accessibility evaluation tool
- [ ] Validate HTML with W3C validator
- [ ] Test color contrast with browser tools

### Manual Testing
- [ ] Navigate entire site with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Check focus indicators are visible
- [ ] Verify heading hierarchy is logical
- [ ] Test at 200% zoom level
- [ ] Check with reduced motion preferences

### Screen Reader Testing

**VoiceOver (macOS)**
```bash
Cmd+F5 to toggle
VO+A to read all
VO+Right Arrow to navigate
```

**NVDA (Windows)**
```
Ctrl+Alt+N to start
Insert+Down to read all
Down Arrow to navigate
```

## Common Patterns

### Skip Links

Add skip-to-content link for keyboard users:

```svelte
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<main id="main-content">
  <!-- Content -->
</main>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--color-primary);
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
```

### Accessible Forms

```svelte
<label for="search">Search documentation</label>
<input
  id="search"
  type="search"
  aria-describedby="search-hint"
/>
<span id="search-hint">Press / to focus search</span>
```

### Loading States

```svelte
<div role="status" aria-live="polite">
  {#if loading}
    <span aria-label="Loading content">Loading...</span>
  {/if}
</div>
```

## Reduced Motion

Respect user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

## Related

- [ThemeToggle Component](../components/theme-toggle.md) - Accessible theme switcher
- [DocsLayout Component](../components/docs-layout.md) - Accessible layout structure
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Accessibility requirements for contributions
