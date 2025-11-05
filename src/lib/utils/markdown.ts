/**
 * Markdown generation utilities
 * Used by documentation generation scripts
 */

/**
 * Generate markdown table from rows
 *
 * @param headers - Table headers
 * @param rows - Table rows (each row is an array of cell values)
 * @returns Markdown table
 *
 * @example
 * ```typescript
 * generateTable(
 *   ['Name', 'Description'],
 *   [
 *     ['foo', 'A function'],
 *     ['bar', 'Another function']
 *   ]
 * )
 * // Returns:
 * // | Name | Description |
 * // | --- | --- |
 * // | foo | A function |
 * // | bar | Another function |
 * ```
 */
export function generateTable(headers: string[], rows: string[][]): string {
	if (!headers.length || !rows.length) {
		return '';
	}

	const lines: string[] = [];

	// Header row
	lines.push(`| ${headers.join(' | ')} |`);

	// Separator row
	lines.push(`| ${headers.map(() => '---').join(' | ')} |`);

	// Data rows
	for (const row of rows) {
		// Escape pipes in cell content
		const escapedRow = row.map((cell) => String(cell).replace(/\|/g, '\\|'));
		lines.push(`| ${escapedRow.join(' | ')} |`);
	}

	return lines.join('\n');
}

/**
 * Generate auto-generated file header with warning
 *
 * @param sourceFile - Source file path that generated this doc
 * @param additionalNote - Optional additional note to include
 * @returns Header markdown with warning callout
 *
 * @example
 * ```typescript
 * generateHeader('package.json', 'Run `pnpm docs:commands` to regenerate')
 * // Returns:
 * // > [!WARNING]
 * // > **Auto-generated documentation - Do not edit manually**
 * // >
 * // > - **Source**: `package.json`
 * // > - **Generated**: 2025-01-15T10:30:00.000Z
 * // > - **Note**: Run `pnpm docs:commands` to regenerate
 * ```
 */
export function generateHeader(sourceFile: string, additionalNote?: string): string {
	const timestamp = new Date().toISOString();
	const lines = [
		`> [!WARNING]`,
		`> **Auto-generated documentation - Do not edit manually**`,
		`>`,
		`> - **Source**: \`${sourceFile}\``,
		`> - **Generated**: ${timestamp}`,
	];

	if (additionalNote) {
		lines.push(`> - **Note**: ${additionalNote}`);
	}

	lines.push('');

	return lines.join('\n');
}

/**
 * Generate a markdown section with title and content
 *
 * @param title - Section title
 * @param content - Section content
 * @param level - Heading level (1-6), defaults to 2
 * @returns Section markdown
 *
 * @example
 * ```typescript
 * generateSection('API Reference', 'The API provides...', 2)
 * // Returns:
 * // ## API Reference
 * //
 * // The API provides...
 * ```
 */
export function generateSection(title: string, content: string, level: number = 2): string {
	const heading = '#'.repeat(Math.max(1, Math.min(6, level)));
	return `${heading} ${title}\n\n${content}\n`;
}

/**
 * Escape markdown special characters
 *
 * @param text - Text to escape
 * @returns Escaped text
 *
 * @example
 * ```typescript
 * escapeMarkdown('Use `backticks` for code')
 * // Returns: 'Use \`backticks\` for code'
 * ```
 */
export function escapeMarkdown(text: string): string {
	return text.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

/**
 * Format a code block
 *
 * @param code - Code content
 * @param language - Language identifier for syntax highlighting
 * @returns Code block markdown
 *
 * @example
 * ```typescript
 * codeBlock('console.log("hello")', 'javascript')
 * // Returns:
 * // ```javascript
 * // console.log("hello")
 * // ```
 * ```
 */
export function codeBlock(code: string, language: string = ''): string {
	return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Generate a list (bulleted or numbered)
 *
 * @param items - List items
 * @param ordered - Whether to use numbered list (default: false for bullets)
 * @returns List markdown
 *
 * @example
 * ```typescript
 * generateList(['First', 'Second', 'Third'], false)
 * // Returns:
 * // - First
 * // - Second
 * // - Third
 *
 * generateList(['First', 'Second'], true)
 * // Returns:
 * // 1. First
 * // 2. Second
 * ```
 */
export function generateList(items: string[], ordered: boolean = false): string {
	return items
		.map((item, index) => {
			const marker = ordered ? `${index + 1}.` : '-';
			return `${marker} ${item}`;
		})
		.join('\n');
}
