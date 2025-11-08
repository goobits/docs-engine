# ThemeToggle Component

The `ThemeToggle` component provides a user-friendly way to switch between light and dark themes in your documentation site. It showcases the W3C Design Tokens system and modern CSS architecture used in `@goobits/docs-engine`.

## Features

- **Automatic Theme Detection**: Respects system preference on first load
- **LocalStorage Persistence**: Remembers user's theme choice across sessions
- **Smooth Transitions**: Uses CSS transitions for elegant theme switching
- **Accessible**: Full keyboard navigation and ARIA support
- **Svelte 5 Runes**: Built with modern Svelte 5 reactive syntax
- **BEM CSS**: Follows BEM naming convention for maintainable styles
- **W3C Design Tokens**: Uses semantic design tokens for consistent theming

## Installation

The ThemeToggle component is included in `@goobits/docs-engine` v2.0.0+.

```typescript
import { ThemeToggle } from '@goobits/docs-engine/components';
```

## Basic Usage

The simplest way to use the ThemeToggle is to add it to your layout:

```svelte
<script>
  import { ThemeToggle } from '@goobits/docs-engine/components';
</script>

<ThemeToggle />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultTheme` | `'light' \| 'dark'` | `'light'` | Default theme if no preference is saved |
| `class` | `string` | `''` | Custom class name for additional styling |

## Examples

### With Custom Default Theme

```svelte
<ThemeToggle defaultTheme="dark" />
```

### With Custom Styling

```svelte
<ThemeToggle class="my-custom-toggle" />
```

### In DocsLayout

The ThemeToggle is automatically included in the `DocsLayout` component:

```svelte
<script>
  import { DocsLayout } from '@goobits/docs-engine/components';
</script>

<DocsLayout
  content={htmlContent}
  title="My Docs"
  navigation={sections}
  currentPath={path}
/>
```

## How It Works

### Theme Persistence

The component uses `localStorage` to persist the user's theme choice:

1. **First Visit**: Checks for saved preference in `localStorage`
2. **No Preference**: Falls back to system preference (`prefers-color-scheme`)
3. **Toggle**: Saves new preference to `localStorage`

### Theme Application

When a theme is selected, the component:

1. Sets `data-theme` attribute on `document.documentElement`
2. Adds/removes `dark` class for compatibility
3. Triggers CSS transitions defined in the design tokens

### System Preference Tracking

The component listens for system theme changes and automatically updates if no user preference is set:

```javascript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', handleChange);
```

## Styling

The component uses BEM naming convention with W3C design tokens:

```css
.theme-toggle {
  /* Uses design tokens */
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
}

.theme-toggle__icon--sun {
  color: var(--color-warning-500); /* Yellow sun */
}

.theme-toggle__icon--moon {
  color: var(--color-primary-400); /* Blue moon */
}
```

### Custom Styling

You can override styles using the `class` prop:

```svelte
<ThemeToggle class="my-toggle" />

<style>
  :global(.my-toggle) {
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-full);
  }
</style>
```

## Accessibility

The ThemeToggle component follows WCAG 2.1 accessibility guidelines:

### Keyboard Navigation

- **Enter**: Toggle theme
- **Space**: Toggle theme
- **Tab**: Focus the button

### Screen Reader Support

```html
<button
  role="switch"
  aria-checked="true|false"
  aria-label="Switch to dark theme"
  title="Switch to dark theme"
>
  <!-- Icon -->
</button>
```

### Reduced Motion

The component respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    transition: none !important;
  }
}
```

## Theme Configuration

### Design Tokens

Themes are defined using W3C design tokens in `_design-tokens.css`:

```css
:root {
  /* Light theme (default) */
  --color-background: hsl(0, 0%, 100%);
  --color-text-primary: hsla(0, 0%, 0%, 0.95);
  /* ... more tokens */
}

[data-theme='dark'] {
  /* Dark theme overrides */
  --color-background: hsl(0, 0%, 7%);
  --color-text-primary: hsla(0, 0%, 100%, 0.95);
  /* ... more tokens */
}
```

### Smooth Transitions

The theme transition is configured in the design tokens:

```css
:root {
  --transition-theme:
    background-color var(--duration-normal) var(--ease-out),
    color var(--duration-normal) var(--ease-out),
    border-color var(--duration-normal) var(--ease-out);
}
```

### Catppuccin Mocha Theme

An optional enhanced dark theme using Catppuccin Mocha is available in `_theme-toggle.css`. Uncomment the `[data-theme='dark-catppuccin']` section to enable it.

## API Reference

### ThemeToggle Component

```typescript
interface Props {
  /** Default theme if no preference is saved */
  defaultTheme?: 'light' | 'dark';

  /** Custom class name for additional styling */
  class?: string;
}
```

### Methods

The component exposes the following internal methods (via Svelte 5 runes):

- `initializeTheme()`: Loads theme from localStorage or system preference
- `applyTheme(theme)`: Applies theme to document
- `toggleTheme()`: Toggles between light and dark themes
- `handleKeydown(event)`: Handles keyboard navigation

### Events

The component uses `onclick` and `onkeydown` for interaction. Theme changes are persisted automatically.

## Browser Support

The ThemeToggle component works in all modern browsers that support:

- CSS Custom Properties (CSS Variables)
- localStorage API
- matchMedia API
- CSS Transitions

### Graceful Degradation

On browsers without JavaScript:
- Theme defaults to light mode
- CSS `@media (prefers-color-scheme: dark)` provides basic dark mode support

## Testing

### Manual Testing

1. **Toggle Functionality**: Click the button to switch themes
2. **Persistence**: Reload the page - theme should persist
3. **System Preference**: Clear localStorage and check system preference detection
4. **Keyboard**: Tab to button, press Enter/Space to toggle
5. **Screen Reader**: Test with screen reader for proper announcements

### Automated Testing

Due to the Svelte component testing infrastructure not being configured in this project, the ThemeToggle component should be tested manually or in a browser environment.

## Performance

The ThemeToggle component is highly performant:

- **Bundle Size**: ~2KB (component + CSS)
- **Runtime**: No re-renders after mount (uses reactive statements)
- **CSS Transitions**: Hardware-accelerated with `transform` and `opacity`
- **LocalStorage**: Synchronous but minimal impact

## Best Practices

1. **Place High in DOM**: Add to layout header for visibility
2. **Don't Nest**: Keep at top level, not inside nested components
3. **Single Instance**: Use only one ThemeToggle per page
4. **Respect Preference**: Don't force a theme, let users choose
5. **Test Both Themes**: Ensure all content is readable in both themes

## Troubleshooting

### Theme Not Persisting

Check localStorage permissions in browser:

```javascript
// Test localStorage
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage is working');
} catch (e) {
  console.error('localStorage is disabled', e);
}
```

### Icons Not Showing

Ensure the component is mounted:

```svelte
{#if mounted}
  <!-- Icons render after mount -->
{/if}
```

### Transitions Too Fast/Slow

Adjust transition duration in design tokens:

```css
:root {
  --duration-normal: 300ms; /* Slower */
  --duration-fast: 150ms; /* Faster */
}
```

## Related

- [W3C Design Tokens](../ARCHITECTURE.md#design-tokens)
- [DocsLayout Component](./docs-layout.md)
- [CSS Architecture](../ARCHITECTURE.md#css-architecture)
- [Accessibility Guidelines](../guides/accessibility.md)

## Examples in Production

See the ThemeToggle in action:

- [Docs Engine Documentation](https://docs-engine.goobits.dev)
- [Component Showcase](https://docs-engine.goobits.dev/components)

## Source Code

- Component: [`src/lib/components/ThemeToggle.svelte`](../../src/lib/components/ThemeToggle.svelte)
- CSS: [`src/lib/styles/components/_theme-toggle.css`](../../src/lib/styles/components/_theme-toggle.css)
- Types: Inline in component file
