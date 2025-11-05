# 📖 Documentation Styling Guide

A comprehensive style guide for creating clean, scannable, and professional documentation that respects the reader's time.

## ✨ Key Principles

- **Clarity over cleverness** - Direct, precise language
- **Show over tell** - Code examples before explanations
- **Scannable structure** - Headers, bullets, consistent formatting
- **Understated elegance** - Professional tone, minimal hype
- **Functional emojis** - Visual navigation aids, not decoration
- **Real examples** - Working code, not pseudo-code

## 🚀 Quick Reference

### Emoji Patterns

Use these consistently across documentation:

```markdown
🚀 Quick Start / Getting Started
✨ Features / Highlights / Key Features
📚 Documentation / Library / Docs
🛠️ Tools / Configuration / Setup
⚙️ Settings / Config / Options
📖 Docs / Guides / Resources
🔗 Links / Related / References
🧪 Testing / Development / Contributing
💡 Help / Support / Tips
📝 License / Legal / Notes
🎯 Simple/Direct features
🔧 Technical/Tool features
🌐 Network/Global features
🤖 AI/Bot/Automation features
⚡ Performance/Speed features
🔄 Sync/Update features
📦 Package/Installation features
🎨 Design/UI features
🔒 Security features
📊 Analytics/Metrics features
```

### Writing Guidelines

**Do:**
- Use factual, concise descriptions
- Start with what it does, not why it's great
- Include real, runnable code examples
- Add helpful comments with `#` in code blocks
- Use consistent bullet formatting
- Progress from simple → complex
- Group related content logically

**Don't:**
- Use promotional or sales language
- Include superlatives ("amazing", "powerful", "revolutionary")
- Write pseudo-code or placeholder examples
- Over-explain when code is self-documenting
- Create files unnecessarily (prefer editing existing)
- Use emojis outside of headers

## 📚 Standard Template

### Complete Structure

```markdown
# [emoji] Project Name
[One-line description of what it does - factual, not promotional]

## ✨ Key Features
- **[emoji] Feature Name** - What it does
- **[emoji] Feature Name** - Specific capability
- **[emoji] Feature Name** - Another capability
- **[emoji] Feature Name** - One more feature

## 🚀 Quick Start

```bash
# Installation
npm install package-name
# or
pnpm add package-name
# or
yarn add package-name

# Configuration (minimal required setup)
export API_KEY="your-api-key"
# or via config file
echo "API_KEY=your-api-key" > .env

# Basic usage
package-name command

# Pipe example
echo "input" | package-name process

# More complex example
package-name command --flag value --option
```

## 📚 [Language] Library

```language
# Import
import { main, helper } from 'package-name';

# Basic usage
const result = main('input');
console.log(result);

# Intermediate usage (async/streaming)
const stream = await main.stream('input');
for await (const chunk of stream) {
  console.log(chunk);
}

# Advanced (sessions/state)
const session = new Session({
  key: 'value',
  option: true
});
const result = await session.execute();
```

## 🛠️ Advanced Features

```language
# Real-world use case
import { advanced } from 'package-name';

const config = {
  feature: true,
  customValue: 'example'
};

const result = advanced.process(config);

# Custom extensions
class CustomHandler extends BaseHandler {
  handle(input) {
    // Your custom logic
    return super.handle(input);
  }
}
```

## ⚙️ Configuration

```bash
# View current config
package-name config list

# Set configuration
package-name config set key value
# or via environment variable
export PACKAGE_KEY=value

# Using config file
cat > config.json << EOF
{
  "key": "value",
  "option": true
}
EOF

# Shortcuts and aliases
package-name alias short-name "long-command --with flags"
```

## 📖 Documentation

- **[Getting Started](path/to/guide.md)** - Initial setup and basic usage
- **[API Reference](path/to/api.md)** - Complete API documentation
- **[Advanced Guide](path/to/advanced.md)** - Advanced features and patterns
- **[Migration Guide](path/to/migration.md)** - Upgrading from previous versions
- **[FAQ](path/to/faq.md)** - Common questions and solutions

## 🔗 Related Projects

- **[Project Name](url)** - What it does
- **[Companion Tool](url)** - How it relates
- **[Integration](url)** - How they work together

## 🧪 Development

```bash
# Clone and setup
git clone https://github.com/user/repo.git
cd repo
npm install

# Run tests
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests

# Code quality
npm run lint               # Check for issues
npm run lint:fix           # Auto-fix issues
npm run format             # Format code
npm run type-check         # TypeScript checks

# Build
npm run build              # Production build
npm run dev                # Development mode
```

## 💡 Support

- **[GitHub Issues](url)** - Report bugs and request features
- **[Discussions](url)** - Ask questions and share ideas
- **[Discord](url)** - Community chat and support

## 📝 License

MIT - see [LICENSE](LICENSE) for details
```

## 🛠️ Code Block Best Practices

### Always Specify Language

```bash
# Good - with language
```bash
npm install package
```

# Bad - no language
```
npm install package
```
```

### Include Helpful Comments

```javascript
// Import required modules
import { parse } from 'package';

// Configure options
const options = {
  strict: true,      // Enable strict mode
  verbose: false     // Suppress verbose output
};

// Process input
const result = parse(input, options);
```

### Show Multiple Approaches

```bash
# Method 1: CLI flags
command --key value --flag

# Method 2: Environment variables
export KEY=value
command --flag

# Method 3: Config file
echo "key: value" > config.yml
command --config config.yml --flag
```

### Real, Runnable Examples

```javascript
// Good - complete, runnable code
import { createServer } from 'http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});

// Bad - pseudo-code
// create server
// handle request
// send response
```

## 📖 Header Hierarchy

### Level 1: Project Name
```markdown
# 🚀 Project Name
```
Always includes emoji + project name at the top.

### Level 2: Major Sections
```markdown
## ✨ Key Features
## 🚀 Quick Start
## 📚 API Reference
## ⚙️ Configuration
```
Main sections that organize the documentation.

### Level 3: Subsections
```markdown
### Installation Options
### Basic Usage
### Advanced Patterns
```
Used within major sections for organization.

### Level 4: Specific Topics
```markdown
#### Environment Variables
#### Command Line Flags
```
Rare, use only when deeper nesting is needed.

## 🎯 Feature Descriptions

### Format
```markdown
- **[emoji] Feature Name** - What it does (not why it's great)
```

### Good Examples
```markdown
- **🔧 TypeScript Support** - Full type definitions and IntelliSense
- **⚡ Fast Builds** - Sub-second rebuilds with incremental compilation
- **📦 Zero Config** - Works out of the box with sensible defaults
- **🔌 Plugin System** - Extend functionality with custom plugins
```

### Bad Examples
```markdown
- **Amazing TypeScript Support** - The best TypeScript experience you'll ever have!
- **Blazingly Fast** - Incredibly fast builds that will blow your mind
- **Super Easy** - So simple anyone can use it
- **Powerful Plugins** - Unlock unlimited potential with our plugin ecosystem
```

## 📋 Optional Sections

Include only when relevant:

### Screenshots/Demos
```markdown
## 📸 Screenshots

![Feature Name](./images/screenshot.png)
*Caption describing what the image shows*
```

### Badges
```markdown
[![npm version](badge-url)](link-url)
[![build status](badge-url)](link-url)
[![coverage](badge-url)](link-url)
```
Place at the top, below the project name.

### Performance Benchmarks
```markdown
## ⚡ Performance

| Operation | Time | Memory |
|-----------|------|--------|
| Parse 1MB | 12ms | 15MB   |
| Build     | 450ms| 120MB  |
| Hot reload| 8ms  | 5MB    |
```

### Migration Guides
```markdown
## 🔄 Migration from v1.x

### Breaking Changes
- `oldFunction()` → `newFunction()`
- Config format changed from JSON to YAML

### Step-by-Step
1. Update dependency: `npm install package@2.0.0`
2. Run migration script: `npx package migrate`
3. Update config file format
4. Test your application
```

### FAQ
```markdown
## 💡 FAQ

### How do I configure X?
Use the config file or environment variables...

### Why isn't Y working?
Check that you have...
```

### Changelog
```markdown
## 📝 Changelog

### [2.0.0] - 2024-01-15
#### Added
- New feature X
- Support for Y

#### Changed
- Improved performance of Z

#### Fixed
- Bug in A
```

## ✨ Examples from This Project

See the main [README.md](../README.md) for a reference implementation that follows these guidelines:

- Factual feature descriptions
- Real, runnable code examples
- Logical progression (installation → setup → usage)
- Grouped related documentation
- Professional, understated tone
- Minimal required configuration upfront
- Links with context ("what you'll find there")

## 🔗 Related Resources

- **[MDX Style Guide](https://mdxjs.com/docs/)** - Writing content in MDX
- **[CommonMark Spec](https://commonmark.org/)** - Markdown specification
- **[GitHub Flavored Markdown](https://github.github.com/gfm/)** - GitHub's markdown extensions

## 📝 Notes

**Flexibility**: This guide provides structure, not constraints. Adapt sections based on your project's needs.

**Evolution**: Documentation styles evolve. Update this guide as patterns emerge or change.

**User-First**: Always prioritize the reader's time and comprehension. Clear, concise documentation serves everyone better than elaborate prose.

**Consistency**: Once you choose a style (emoji set, code comment style, etc.), maintain it throughout all documentation.
