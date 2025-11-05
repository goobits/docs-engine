---
title: Code Tabs Plugin
description: Display code examples in multiple languages with tabbed interface
section: Plugins
difficulty: beginner
tags: [plugin, code, tabs, examples]
---

# Code Tabs Plugin

Display code examples in multiple languages with tabbed interface.

## Quick Start

### Add to MDSveX Config

```javascript
import { tabsPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        tabsPlugin(),
        // ... other plugins
      ],
    }),
  ],
};
```

### Add Hydrator to Layout

```svelte
<script>
  import { CodeTabsHydrator } from '@goobits/docs-engine/components';
</script>

<CodeTabsHydrator theme="dracula" />
<slot />
```

### Use in Markdown

````markdown
:::tabs
```javascript
// JavaScript example
console.log('Hello World');
```

```typescript
// TypeScript example
const message: string = 'Hello World';
console.log(message);
```

```python
# Python example
print('Hello World')
```
:::
````

---

## Syntax

Wrap multiple code blocks in `:::tabs` / `:::` markers:

````markdown
:::tabs
```language
code here
```

```another-language
more code
```
:::
````

The language identifier becomes the tab label.

---

## Examples

### API Request

````markdown
:::tabs
```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

```javascript
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
});
```

```python
import requests
requests.post(
  'https://api.example.com/users',
  json={'name': 'John'}
)
```
:::
````

### Configuration

````markdown
:::tabs
```javascript
// JavaScript config
export default {
  name: 'my-app',
  version: '1.0.0'
};
```

```json
// JSON config
{
  "name": "my-app",
  "version": "1.0.0"
}
```

```yaml
# YAML config
name: my-app
version: 1.0.0
```
:::
````

---

## Features

- **Automatic language detection** - From code fence identifiers
- **Keyboard navigation** - Arrow keys to switch tabs
- **Persistent selection** - Selected tab remembered across page loads
- **Syntax highlighting** - Works with code highlighting plugin
- **Mobile responsive** - Touch-friendly tabs

---

## Styling

Customize tab appearance:

```css
.code-tabs {
  border-radius: 8px;
  overflow: hidden;
}

.code-tabs__nav {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.code-tabs__tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
}

.code-tabs__tab--active {
  background: var(--color-primary);
  color: white;
}
```

---

## Best Practices

1. **Provide 2-4 languages** - Cover common use cases
2. **Keep examples equivalent** - Show same functionality in each language
3. **Use realistic code** - Full, working examples when possible
4. **Order by popularity** - Most common language first

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge

**Next Steps:**
- [Code Highlighting](./code-highlighting.md) - Syntax highlighting with Shiki

**Related:**
- [Examples Guide](../guides/examples.md) - Code examples and recipes
