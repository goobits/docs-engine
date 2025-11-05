# Code Block Enhancements

Beautiful, feature-rich code blocks with syntax highlighting, line numbers, and interactive controls.

## Overview

The code highlighting system provides a professional, developer-friendly experience for displaying code examples. Built on Shiki, it delivers accurate syntax highlighting with rich metadata support.

## Features

- **Syntax Highlighting** - Powered by Shiki with 20+ languages
- **Copy Button** - One-click code copying with visual feedback
- **Line Numbers** - Optional line numbering with highlighted ranges
- **Line Highlighting** - Emphasize specific lines with `{1,3-5}` syntax
- **File Titles** - Display filenames above code blocks
- **Diff Support** - Show code changes with `+`/`-` prefixes
- **Dark Theme** - Dracula theme optimized for readability

## Basic Usage

### Simple Code Block

````markdown
```typescript
const greeting = "Hello, World!";
console.log(greeting);
```
````

**Result:** Syntax-highlighted code with automatic copy button.

### With Line Numbers

````markdown
```typescript showLineNumbers
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```
````

**Features:**
- Line numbers appear in left gutter
- Numbers are non-selectable (clean copying)
- Matches code theme colors

### With File Title

````markdown
```typescript title="utils.ts"
export function parseConfig(raw: string): Config {
  return JSON.parse(raw);
}
```
````

**Features:**
- Displays filename in styled header
- File icon indicator
- Professional documentation aesthetic

### Line Highlighting

````markdown
```typescript {2,4-6} showLineNumbers
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => {
    const price = item.price;
    const quantity = item.quantity;
    const subtotal = price * quantity;
    return sum + subtotal;
  }, 0);
}
```
````

**Highlights:**
- Line 2: The reduce function
- Lines 4-6: Variable declarations and calculation

**Visual Style:**
- Highlighted lines have subtle background
- Accent-colored left border
- Line numbers emphasized

## Advanced Features

### Diff Syntax

Show code changes with addition and removal markers:

````markdown
```diff
function greet(name: string): string {
-  return "Hello " + name;
+  return `Hello, ${name}!`;
}
```
````

**Result:**
- Lines starting with `+` appear in green (additions)
- Lines starting with `-` appear in red (deletions)
- Other lines show context (unchanged)

### Combined Metadata

Combine multiple features for rich code examples:

````markdown
```typescript title="auth.ts" {8-10} showLineNumbers
import { hash, compare } from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}
```
````

**Features combined:**
- File title: `auth.ts`
- Line numbers: enabled
- Highlighting: lines 8-10 (verifyPassword function)
- Syntax highlighting: TypeScript
- Copy button: automatic

## Supported Languages

### Core Languages

- JavaScript (`javascript`, `js`)
- TypeScript (`typescript`, `ts`)
- TSX/JSX (`tsx`, `jsx`)
- Python (`python`)
- Rust (`rust`)
- Go (`go`)
- Bash/Shell (`bash`, `sh`, `shell`)

### Web Languages

- HTML (`html`)
- CSS (`css`)
- Svelte (`svelte`)
- Markdown (`markdown`)

### Data Formats

- JSON (`json`)
- YAML (`yaml`)
- TOML (`toml`)
- SQL (`sql`)

### Special

- Diff (`diff`) - for change highlighting
- AgentFlow DSL (`agentflow`, `dsl`) - custom grammar

## Configuration

### Plugin Setup

Configure in `svelte.config.js`:

```javascript
import { codeHighlightPlugin } from '@goobits/docs-engine/plugins';

mdsvex({
  remarkPlugins: [
    codeHighlightPlugin({
      theme: 'dracula',              // Syntax theme
      showLineNumbers: false,        // Global line numbers
      showCopyButton: true,          // Enable copy button
      defaultLanguage: 'plaintext'   // Fallback language
    })
  ]
})
```

### Hydration Setup

Add the copy button hydrator to your layout:

```svelte
<script>
  import { CodeCopyHydrator } from '@goobits/docs-engine/components';
</script>

<CodeCopyHydrator theme="dracula" />

<slot />
```

This enables the interactive copy functionality.

### Theme Customization

Customize with CSS variables:

```css
:root {
  --code-bg: #282a36;              /* Code background */
  --code-text: #f8f8f2;            /* Code text color */
  --code-highlight-bg: rgba(255, 255, 255, 0.1);
  --code-highlight-border: #bd93f9;
  --code-diff-add-bg: rgba(34, 197, 94, 0.15);
  --code-diff-add-border: rgb(34, 197, 94);
  --code-diff-remove-bg: rgba(239, 68, 68, 0.15);
  --code-diff-remove-border: rgb(239, 68, 68);
}
```

## Examples

### API Documentation

````markdown
## Authentication

Generate a secure token:

```typescript title="auth.ts" {1,5-7} showLineNumbers
import { sign } from 'jsonwebtoken';

export function generateToken(userId: string): string {
  const payload = { sub: userId, iat: Date.now() };
  return sign(
    payload,
    process.env.JWT_SECRET!
  );
}
```
````

### Migration Guide

````markdown
## Migrating to v2

Update your import paths:

```diff title="app.ts"
- import { config } from './config';
+ import { loadConfig } from '@/lib/config';

- const settings = config.get('api');
+ const settings = await loadConfig('api');
```
````

### Tutorial Steps

````markdown
## Step 3: Add Error Handling

Wrap the API call in a try-catch block:

```typescript {2,6-8} showLineNumbers
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

Focus on lines 6-8 for the error handling logic.
````

## TypeScript Types

### CodeHighlightOptions

```typescript
interface CodeHighlightOptions {
  /** Syntax highlighting theme (default: 'dracula') */
  theme?: string;

  /** Default language when none specified (default: 'plaintext') */
  defaultLanguage?: string;

  /** Enable line numbers by default (default: false) */
  showLineNumbers?: boolean;

  /** Enable copy button (default: true) */
  showCopyButton?: boolean;
}
```

### CodeBlockMetadata

```typescript
interface CodeBlockMetadata {
  /** Programming language for syntax highlighting */
  language: string;

  /** Optional file title displayed above code block */
  title?: string;

  /** Lines to highlight (e.g., [1, 3, 4, 5]) */
  highlightLines?: number[];

  /** Whether to show line numbers */
  showLineNumbers?: boolean;

  /** Whether this is a diff block */
  isDiff?: boolean;

  /** Original metadata string */
  raw: string;
}
```

## Best Practices

### Highlighting Strategy

**Do:** Highlight key lines that demonstrate the concept

````markdown
```typescript {3-5}
function calculate(x: number, y: number) {
  // Core calculation logic
  const sum = x + y;
  const average = sum / 2;
  return { sum, average };
}
```
````

**Don't:** Highlight every line (defeats the purpose)

### File Titles

**Do:** Use titles for complete, standalone files

````markdown
```typescript title="database.ts"
export const db = createClient({ ... });
```
````

**Don't:** Use titles for fragments or examples

### Line Numbers

**Do:** Use line numbers for longer code (>10 lines) or when referencing specific lines

**Don't:** Use line numbers for short snippets (clutters the display)

### Diff Blocks

**Do:** Use diff syntax for migration guides and change documentation

````markdown
```diff title="config.ts"
export const config = {
-  apiUrl: 'http://localhost:3000',
+  apiUrl: process.env.API_URL || 'http://localhost:3000',
};
```
````

**Don't:** Use diff for general code examples

## Accessibility

- **Copy Button**: Full keyboard navigation with `Tab` and `Enter`
- **Focus Indicators**: Visible outline on button focus
- **Screen Readers**: Descriptive ARIA labels and button text
- **Color Independence**: Not relying solely on color for diff syntax

## Performance

- **Lazy Highlighting**: Shiki highlighter created only when needed
- **Singleton Pattern**: Shared highlighter instance across all code blocks
- **Efficient Caching**: Grammar and theme cached after first load
- **Minimal Bundle**: Shiki included only in pages with code blocks

## Troubleshooting

### Copy Button Not Working

**Issue:** Copy button visible but doesn't copy code

**Solution:** Ensure `CodeCopyHydrator` is in your layout:

```svelte
<CodeCopyHydrator theme="dracula" />
```

### Language Not Recognized

**Issue:** Code block renders as plain text

**Solution:** Check language name matches supported list. Common mistakes:
- Use `bash` not `sh`
- Use `typescript` not `ts` for full features
- Use `javascript` not `js` for full features

### Line Highlighting Not Showing

**Issue:** Syntax `{1,3-5}` doesn't highlight lines

**Solution:** Ensure proper spacing in info string:

```markdown
// ✅ Correct
```typescript {1,3-5}

// ❌ Wrong (no space)
```typescript{1,3-5}
```

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - Plugin system design
- [Examples](./EXAMPLES.md) - More code examples
- [Styling Guide](./STYLING.md) - Theme customization

---

**Need help?** Check the [GitHub issues](https://github.com/goobits/docs-engine/issues) or open a discussion.
