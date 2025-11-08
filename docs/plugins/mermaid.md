---
title: Mermaid Plugin
description: Render diagrams and flowcharts with mermaid.js syntax
section: Plugins
difficulty: beginner
tags: [plugin, diagrams, mermaid, visualization]
---

# Mermaid Plugin

Render diagrams and flowcharts with mermaid.js syntax.

## Quick Start

### Add to MDSveX Config

:::tabs
```javascript
// JavaScript
import { mermaidPlugin } from '@goobits/docs-engine/plugins';

export default {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        mermaidPlugin(),
        // ... other plugins
      ],
    }),
  ],
};
```

```typescript
// TypeScript
import { mdsvex } from 'mdsvex';
import { mermaidPlugin } from '@goobits/docs-engine/plugins';

const config = {
  preprocess: [
    mdsvex({
      remarkPlugins: [
        mermaidPlugin(),
        // ... other plugins
      ],
    }),
  ],
};

export default config;
```
:::

### Add Hydrator to Layout

```svelte
<script>
  import { MermaidHydrator } from '@goobits/docs-engine/components';
</script>

<MermaidHydrator />
<slot />
```

### Use in Markdown

````markdown
```mermaid
graph LR
  A[Start] --> B[Process]
  B --> C[End]
```
````

---

## Supported Diagram Types

### Flowchart

````markdown
```mermaid
flowchart TD
  Start([Start]) --> Decision{Is it?}
  Decision -->|Yes| End1([Success])
  Decision -->|No| End2([Failure])
```
````

**Result:**

```mermaid
flowchart TD
  Start([Start]) --> Decision{Is it?}
  Decision -->|Yes| End1([Success])
  Decision -->|No| End2([Failure])
```

### Sequence Diagram

````markdown
```mermaid
sequenceDiagram
  participant Client
  participant Server
  Client->>Server: Request
  Server-->>Client: Response
```
````

**Result:**

```mermaid
sequenceDiagram
  participant Client
  participant Server
  Client->>Server: Request
  Server-->>Client: Response
```

### State Diagram

````markdown
```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Running
  Running --> Completed
  Running --> Failed
  Completed --> [*]
  Failed --> [*]
```
````

**Result:**

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Running
  Running --> Completed
  Running --> Failed
  Completed --> [*]
  Failed --> [*]
```

### Class Diagram

````markdown
```mermaid
classDiagram
  class User {
    +String name
    +String email
    +login()
  }
  class Admin {
    +manageUsers()
  }
  User <|-- Admin
```
````

### Gantt Chart

````markdown
```mermaid
gantt
  title Project Timeline
  section Planning
  Requirements :done, 2024-01-01, 5d
  Design :active, 2024-01-06, 7d
  section Development
  Implementation : 2024-01-13, 14d
```
````

---

## Configuration

### Theme

```javascript
mermaidPlugin({
  theme: 'dark'  // or 'default', 'forest', 'neutral'
})
```

### Custom Config

```javascript
mermaidPlugin({
  theme: 'dark',
  flowchart: {
    curve: 'basis'
  },
  sequence: {
    actorMargin: 50
  }
})
```

---

## Examples

### Architecture Diagram

````markdown
```mermaid
graph TB
  subgraph "Client"
    A[Browser]
  end
  subgraph "Server"
    B[API]
    C[Database]
  end
  A -->|HTTPS| B
  B -->|Query| C
```
````

### Data Flow

````markdown
```mermaid
flowchart LR
  Input[Markdown] --> Parse[Parser]
  Parse --> Transform[Plugin]
  Transform --> Output[HTML]
```
````

---

## Best Practices

1. **Keep diagrams simple** - Max 10-15 nodes for readability
2. **Use descriptive labels** - Clear, concise text
3. **Group related nodes** - Use subgraphs for organization
4. **Test rendering** - Preview locally before committing

---

## Performance

Mermaid adds ~250KB to bundle. For docs with many diagrams:

- Consider lazy loading
- Use static image exports for simple diagrams
- Limit diagrams per page

---

## Related Documentation

**Prerequisites:** Basic markdown knowledge, understanding of diagram types

**Next Steps:**
- [Diagrams Guide](../guides/diagrams.md) - Visual architecture examples

**Related:**
- [Mermaid.js Documentation](https://mermaid.js.org/) - Complete syntax reference
