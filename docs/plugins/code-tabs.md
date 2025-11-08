---
title: Code Tabs Plugin
description: Display code examples in multiple languages with interactive tabbed interface
section: Plugins
difficulty: beginner
tags: [plugin, code, tabs, examples, multi-language]
---

# Code Tabs Plugin

Display code examples in multiple languages with an interactive tabbed interface.

## Quick Start

### Add to MDSveX Config

````tabs:code-tabs-config
tab: JavaScript
---
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
---
tab: TypeScript
---
```typescript
import { mdsvex } from 'mdsvex';
import { tabsPlugin } from '@goobits/docs-engine/plugins';
import type { Config } from '@sveltejs/kit';

const config: Config = {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        tabsPlugin(),
        // ... other plugins
      ],
    }),
  ],
};

export default config;
```
````

### Add Hydrator to Layout

```svelte
<script>
  import { CodeTabsHydrator } from '@goobits/docs-engine/components';
</script>

<CodeTabsHydrator theme="dracula" />
<slot />
```

### Use in Markdown

Use a code fence with `tabs:id` as the language, then define tabs with `tab: Label` markers:

`````markdown
````tabs:hello-world
tab: JavaScript
---
```js
console.log('Hello World');
```
---
tab: TypeScript
---
```ts
const message: string = 'Hello World';
console.log(message);
```
---
tab: Python
---
```py
print('Hello World')
```
````
`````

---

## Syntax

### Basic Structure

`````markdown
````tabs:unique-id
tab: Tab Label 1
---
```language
code here
```
---
tab: Tab Label 2
---
```language
more code
```
````
`````

### Key Components

1. **Tabs ID**: `tabs:unique-id` - Must be unique per page
2. **Tab Marker**: `tab: Label` - Defines tab name
3. **Separator**: `---` - Separates tabs and sections
4. **Code Block**: Standard markdown code fence with language
5. **Multiple Tabs**: Repeat tab markers and code blocks

---

## Examples

### API Request (3 Languages)

`````markdown
````tabs:api-request
tab: cURL
---
```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```
---
tab: JavaScript
---
```js
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John',
    email: 'john@example.com'
  })
});
const data = await response.json();
```
---
tab: Python
---
```py
import requests

response = requests.post(
    'https://api.example.com/users',
    json={'name': 'John', 'email': 'john@example.com'}
)
data = response.json()
```
````
`````

### Configuration Files

`````markdown
````tabs:config-examples
tab: JavaScript
---
```js
// JavaScript config
export default {
  name: 'my-app',
  version: '1.0.0',
  dependencies: {
    svelte: '^4.0.0'
  }
};
```
---
tab: TypeScript
---
```ts
// TypeScript config
import type { Config } from './types';

const config: Config = {
  name: 'my-app',
  version: '1.0.0',
  dependencies: {
    svelte: '^4.0.0'
  }
};

export default config;
```
---
tab: JSON
---
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "svelte": "^4.0.0"
  }
}
```
---
tab: YAML
---
```yaml
name: my-app
version: 1.0.0
dependencies:
  svelte: ^4.0.0
```
````
`````

### Package Manager Commands

`````markdown
````tabs:install-commands
tab: npm
---
```bash
npm install @goobits/docs-engine
npm run dev
```
---
tab: pnpm
---
```bash
pnpm add @goobits/docs-engine
pnpm dev
```
---
tab: yarn
---
```bash
yarn add @goobits/docs-engine
yarn dev
```
---
tab: bun
---
```bash
bun add @goobits/docs-engine
bun dev
```
````
`````

### Function Implementations

`````markdown
````tabs:function-example
tab: JavaScript
---
```js
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```
---
tab: TypeScript
---
```ts
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```
---
tab: Python
---
```py
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))  # 55
```
---
tab: Rust
---
```rust
fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        return n;
    }
    fibonacci(n - 1) + fibonacci(n - 2)
}

fn main() {
    println!("{}", fibonacci(10)); // 55
}
```
````
`````

---

## Features

### Automatic Language Detection

Language identifiers in code fences determine syntax highlighting:

```js  // ← JavaScript highlighting
```ts  // ← TypeScript highlighting
```py  // ← Python highlighting
```

### Interactive Tabs

- **Click to switch** - Mouse or touch
- **Keyboard navigation** - Arrow keys to navigate
- **Persistent selection** - Selected tab remembered across page loads (per tabs-id)
- **Deep linking** - URL hash support for specific tabs

### Syntax Highlighting Integration

Works seamlessly with the code highlighting plugin. All code inside tabs receives proper syntax highlighting automatically.

### Mobile Responsive

- Touch-friendly tab buttons
- Horizontal scroll for many tabs
- Optimized for small screens

---

## Configuration

### Tabs ID

Each tabs group needs a unique ID:

```markdown
```tabs:config-1     ← Unique ID
```tabs:api-example  ← Different ID
```tabs:setup-steps  ← Another unique ID
```

> [!IMPORTANT]
> IDs must be unique per page to avoid conflicts!

### Tab Labels

Labels can be any text:

```markdown
tab: JavaScript
tab: TypeScript (Recommended)
tab: Python 3.11+
tab: cURL Example
```

### Code Languages

Support all languages that Shiki supports (100+):

- JavaScript, TypeScript, JSX, TSX
- Python, Ruby, PHP, Go, Rust
- Bash, PowerShell, Shell
- JSON, YAML, TOML, XML
- CSS, SCSS, LESS
- SQL, GraphQL
- And many more!

---

## Styling

Tabs render with semantic classes:

```html
<div class="md-code-tabs" data-tabs-id="example" data-tabs="...">
  <div class="md-code-tabs__nav">
    <button class="md-code-tabs__tab md-code-tabs__tab--active">
      JavaScript
    </button>
    <button class="md-code-tabs__tab">
      TypeScript
    </button>
  </div>
  <div class="md-code-tabs__content">
    <!-- Code content here -->
  </div>
</div>
```

### CSS Classes

- `.md-code-tabs` - Container
- `.md-code-tabs__nav` - Tab navigation
- `.md-code-tabs__tab` - Individual tab button
- `.md-code-tabs__tab--active` - Active tab state
- `.md-code-tabs__content` - Content area

### Custom Styling

```css
.md-code-tabs {
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.md-code-tabs__nav {
  background: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
}

.md-code-tabs__tab {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
}

.md-code-tabs__tab:hover {
  background: var(--color-hover);
}

.md-code-tabs__tab--active {
  background: var(--color-primary);
  color: white;
}
```

---

## Best Practices

### 1. Provide 2-4 Languages

Too few: Users miss options
Too many: UI becomes cluttered

```markdown
✅ Good: JavaScript, TypeScript, Python
✅ Good: npm, pnpm, yarn, bun
❌ Too many: JS, TS, Python, Ruby, PHP, Go, Rust, Java
```

### 2. Keep Examples Equivalent

Each tab should show the **same functionality** in different languages:

```markdown
✅ Good: All tabs fetch user data
❌ Bad: Tab 1 fetches users, Tab 2 creates users, Tab 3 deletes users
```

### 3. Order by Popularity

Put most common language first:

```markdown
✅ Good: JavaScript → TypeScript → Python
❌ Bad: Rust → Haskell → JavaScript
```

### 4. Use Realistic Code

Full, working examples are better than snippets:

```markdown
✅ Good: Complete API call with error handling
❌ Bad: Just `fetch(url)` without context
```

### 5. Consistent Tab Labels

Use consistent naming across your docs:

```markdown
✅ Good: "JavaScript" everywhere
❌ Bad: "JavaScript", "JS", "ECMAScript", "Node.js"
```

---

## Common Use Cases

### Installation Instructions

Show different package managers:

```markdown
````tabs:install
tab: npm
---
```bash
npm install package-name
```
---
tab: pnpm
---
```bash
pnpm add package-name
```
````
```

### API Examples

Show different programming languages:

```markdown
````tabs:api
tab: JavaScript
---
```js
await fetch('/api/data')
```
---
tab: Python
---
```py
requests.get('/api/data')
```
````
```

### Configuration Formats

Show different config file formats:

```markdown
````tabs:config
tab: JSON
---
```json
{ "key": "value" }
```
---
tab: YAML
---
```yaml
key: value
```
````
```

### Framework Comparisons

Show same feature in different frameworks:

```markdown
````tabs:frameworks
tab: React
---
```jsx
const [count, setCount] = useState(0);
```
---
tab: Vue
---
```vue
const count = ref(0);
```
---
tab: Svelte
---
```svelte
let count = 0;
```
````
```

---

## Troubleshooting

> [!QUESTION] Tabs not rendering?
>
> **Check:**
> 1. Plugin added to MDSveX config: `tabsPlugin()`
> 2. Hydrator imported in layout: `<CodeTabsHydrator />`
> 3. Syntax is correct: ` ```tabs:id ` (not `:::tabs`)
> 4. Tab markers present: `tab: Label`
> 5. Separators present: `---`

> [!QUESTION] Tabs ID must be unique?
>
> Yes! Each tabs group needs a unique ID. Duplicate IDs will cause conflicts.
>
> ```markdown
> ````tabs:example-1  ✅ Unique
> ````tabs:example-2  ✅ Different
> ````tabs:example-1  ❌ Duplicate!
> ```

> [!QUESTION] Can I nest tabs?
>
> No, tabs cannot be nested inside other tabs. Keep structure flat.

> [!QUESTION] Syntax highlighting not working?
>
> Ensure `codeHighlightPlugin()` runs **after** `tabsPlugin()` in your plugin order:
>
> ```js
> remarkPlugins: [
>   tabsPlugin(),
>   // ... other plugins
>   codeHighlightPlugin(), // ← Must be last
> ]
> ```

---

## Accessibility

Tabs include accessibility features:

- `role="tablist"` - Tab navigation
- `role="tab"` - Individual tabs
- `role="tabpanel"` - Content panels
- `aria-selected` - Active tab state
- `aria-controls` - Tab-to-panel relationships
- Keyboard navigation (Arrow keys, Home, End)

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge, code highlighting setup

**Next Steps:**
- [Code Highlighting](./code-highlighting.md) - Syntax highlighting with Shiki
- [Collapse Plugin](./collapse.md) - Collapsible sections

**Related:**
- [Plugin Order](../guides/plugin-order.md) - Understanding plugin execution
- [Examples Guide](../guides/examples.md) - More code examples
