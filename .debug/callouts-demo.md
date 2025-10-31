# Callouts Enhancement Demo

This document demonstrates all the enhanced callout types with various content.

## Basic Callouts

### NOTE Callout
> [!NOTE]
> This is a standard note callout with the default title.
> It can contain **bold text**, *italic text*, and `inline code`.

### TIP Callout
> [!TIP]
> Here's a helpful tip with a [link to documentation](https://example.com).
> Tips help users learn better practices.

### IMPORTANT Callout
> [!IMPORTANT]
> This is critical information that users must understand.
> - First important point
> - Second important point
> - Third important point

### WARNING Callout
> [!WARNING]
> Be careful when performing this operation!
>
> It may have unintended consequences if not done correctly.

### CAUTION Callout
> [!CAUTION]
> This is a high-severity warning that requires immediate attention.
> Do not proceed without reading the full documentation.

## New Callout Types

### SUCCESS Callout
> [!SUCCESS]
> Operation completed successfully!
> All tests passed and the deployment is live.

### DANGER Callout
> [!DANGER]
> This action cannot be undone and will permanently delete all data.
> Make sure you have a backup before proceeding.

### INFO Callout
> [!INFO]
> Additional context and background information.
> This provides supplementary details that may be helpful.

### QUESTION Callout
> [!QUESTION]
> Why does this happen?
>
> Sometimes you need to pose a question to help readers think critically.

## Custom Titles

### Note with Custom Title
> [!NOTE] Getting Started
> This note has a custom title instead of the default "Note" label.

### Tip with Custom Title
> [!TIP] Pro Tip: Performance Optimization
> Custom titles make your callouts more specific and actionable.

### Success with Custom Title
> [!SUCCESS] Deployment Complete
> Your application has been successfully deployed to production!

### Danger with Custom Title
> [!DANGER] Data Loss Warning
> Proceeding will permanently delete all user data from the database.

## Rich Content Examples

### Callout with Code Block
> [!INFO] Installation Instructions
> To install the package, run the following command:
>
> ```bash
> npm install @goobits/markdown-docs
> ```
>
> Then import it in your project:
>
> ```typescript
> import { renderMarkdown } from '@goobits/markdown-docs';
> ```

### Callout with Lists
> [!IMPORTANT] Prerequisites
> Before you begin, ensure you have:
>
> 1. Node.js 18 or higher installed
> 2. A package manager (npm, yarn, or bun)
> 3. Basic knowledge of:
>    - TypeScript
>    - Markdown syntax
>    - Remark/Unified ecosystem

### Callout with Nested Lists
> [!TIP] Best Practices
> Follow these guidelines:
>
> - **Performance**
>   - Use memoization for expensive calculations
>   - Implement virtual scrolling for long lists
>   - Optimize bundle size with code splitting
> - **Security**
>   - Validate all user input
>   - Use parameterized queries
>   - Keep dependencies updated
> - **Accessibility**
>   - Provide alt text for images
>   - Use semantic HTML
>   - Test with screen readers

### Callout with Mixed Content
> [!WARNING] Configuration Required
> Before running the application, you need to configure your environment:
>
> 1. Copy the example configuration:
>    ```bash
>    cp .env.example .env
>    ```
>
> 2. Update the following variables:
>    - `DATABASE_URL` - Your PostgreSQL connection string
>    - `API_KEY` - Your API key from the dashboard
>    - `PORT` - The port number (default: 3000)
>
> 3. Verify your configuration is correct by running:
>    ```bash
>    npm run verify-config
>    ```
>
> **Note:** Never commit your `.env` file to version control!

### Callout with Links and Formatting
> [!QUESTION] Need Help?
> If you're experiencing issues:
>
> - Check the [documentation](https://docs.example.com)
> - Search [existing issues](https://github.com/example/repo/issues)
> - Join our [Discord community](https://discord.gg/example)
> - Email support at **support@example.com**
>
> For urgent matters, use ~~email~~ our priority support line: `1-800-SUPPORT`

### Callout with Multiple Paragraphs
> [!INFO] About This Feature
> This is a new feature that was introduced in version 2.0.
>
> It provides enhanced functionality and better performance compared to the previous implementation.
>
> The feature is fully backward compatible, so existing code will continue to work without any changes.
>
> However, we recommend migrating to the new API for better type safety and improved developer experience.

## Edge Cases

### Empty Callout
> [!NOTE]

### Callout with Only Title
> [!SUCCESS] Task Completed!

### Case Insensitive
> [!note]
> Callout types are case insensitive.

> [!TiP]
> Mixed case also works!

> [!IMPORTANT]
> UPPERCASE works too.

## All Types Summary

> [!NOTE]
> Standard blue informational callout

> [!TIP]
> Green helpful suggestion

> [!IMPORTANT]
> Purple critical information

> [!WARNING]
> Yellow caution notice

> [!CAUTION]
> Red severe warning

> [!SUCCESS]
> Green success message

> [!DANGER]
> Deep red critical alert

> [!INFO]
> Light blue contextual information

> [!QUESTION]
> Purple question or discussion prompt
