---
title: ThemeToggle
description: User-friendly theme switcher with dark mode support
section: Components
difficulty: beginner
tags: [component, theme, dark-mode, accessibility]
order: 1
---

# ThemeToggle Component

Switch between light and dark themes with automatic system preference detection and localStorage persistence.

## Quick Start

```svelte
<script>
  import { ThemeToggle } from '@goobits/docs-engine/components';
</script>

<ThemeToggle />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `'light' \| 'dark'` | `'light'` | Default theme if no saved preference |
| `class` | `string` | `''` | Custom class for additional styling |

## Examples

### Custom Default Theme

```svelte
<ThemeToggle defaultTheme="dark" />
```

### Custom Styling

```svelte
<ThemeToggle class="header-toggle" />

<style>
  :global(.header-toggle) {
    width: 3rem;
    height: 3rem;
  }
</style>
```

## How It Works

The component handles theme persistence automatically:

1. **First visit** - Checks localStorage, falls back to system preference
2. **User toggles** - Saves choice to localStorage
3. **System changes** - Updates theme if no user preference exists

Themes are applied via `data-theme` attribute on `document.documentElement`:

```html
<html data-theme="dark">
```

## Accessibility

Full WCAG 2.1 compliance:
- Keyboard navigation (Enter/Space to toggle, Tab to focus)
- Screen reader support (`role="switch"`, proper ARIA labels)
- Respects `prefers-reduced-motion`

## Troubleshooting

**Theme not persisting?**
Check localStorage permissions in your browser settings.

**Icons not showing?**
Component renders icons after mount. Ensure parent component is mounted.

**Transitions too fast/slow?**
Customize via CSS custom properties: `--duration-normal`, `--duration-fast`

**Theme flash on load?**
Initialize theme in `<svelte:head>` or `app.html` before content renders.

**Wrong system preference detected?**
Clear localStorage (`localStorage.removeItem('theme')`) to re-detect.

## Related

- [Architecture Guide](../guides/architecture.md) - System design and philosophy
<!-- Coming soon: DocsLayout Component docs (Phase 3) -->
<!-- - [DocsLayout Component](./docs-layout.md) -->
<!-- Coming soon: CSS Architecture section -->
<!-- - [CSS Architecture](../guides/architecture.md#css-architecture) - Styling system -->
<!-- Coming soon: Accessibility Guidelines (Phase 3) -->
<!-- - [Accessibility Guidelines](../guides/accessibility.md) -->
