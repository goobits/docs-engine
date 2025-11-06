import type { BlockContent, Paragraph } from 'mdast';
import { escapeHtml } from './html.js';

/**
 * Markdown-to-HTML rendering utilities
 *
 * Shared functions for rendering markdown AST nodes to HTML.
 * Used by plugins that need to convert markdown content to HTML
 * (callouts, collapse, etc.)
 *
 * @module markdown-renderer
 * @public
 */

/**
 * Render block content (paragraphs, lists, code blocks, etc.) to HTML
 *
 * @param children - Array of mdast BlockContent nodes
 * @returns Rendered HTML string with proper indentation
 * @public
 */
export function renderBlockContent(children: BlockContent[]): string {
	return children
		.map((child) => {
			if (child.type === 'paragraph') {
				const paragraph = child as Paragraph;
				const text = renderInlineContent(paragraph.children);
				return `    <p>${text}</p>`;
			} else if (child.type === 'list') {
				return renderList(child as any, 1);
			} else if (child.type === 'code') {
				const code = child as any;
				const lang = code.lang ? ` class="language-${code.lang}"` : '';
				return `    <pre><code${lang}>${escapeHtml(code.value)}</code></pre>`;
			} else if (child.type === 'blockquote') {
				const quote = child as any;
				const quoteContent = renderBlockContent(quote.children);
				return `    <blockquote>\n${quoteContent}\n    </blockquote>`;
			} else if (child.type === 'heading') {
				const heading = child as any;
				const level = heading.depth;
				const text = renderInlineContent(heading.children);
				return `    <h${level}>${text}</h${level}>`;
			}
			return '';
		})
		.join('\n');
}

/**
 * Render a list with support for nested lists
 *
 * @param list - mdast list node
 * @param depth - Indentation depth (for nested lists)
 * @returns Rendered HTML string with proper indentation
 * @public
 */
export function renderList(list: any, depth: number): string {
	const indent = '    '.repeat(depth);
	const listType = list.ordered ? 'ol' : 'ul';
	const items = list.children
		.map((item: any) => {
			const itemParts: string[] = [];
			item.children.forEach((itemChild: any) => {
				if (itemChild.type === 'paragraph') {
					itemParts.push(renderInlineContent(itemChild.children));
				} else if (itemChild.type === 'list') {
					// Nested list
					itemParts.push('\n' + renderList(itemChild, depth + 1));
				} else if (itemChild.type === 'code') {
					const lang = itemChild.lang ? ` class="language-${itemChild.lang}"` : '';
					itemParts.push(
						`\n${indent}  <pre><code${lang}>${escapeHtml(itemChild.value)}</code></pre>`
					);
				}
			});
			return `${indent}  <li>${itemParts.join('')}</li>`;
		})
		.join('\n');
	return `${indent}<${listType}>\n${items}\n${indent}</${listType}>`;
}

/**
 * Render inline content (text, emphasis, strong, code, links, images, etc.)
 *
 * Handles all inline markdown elements including:
 * - Text, emphasis, strong, inline code
 * - Links, images
 * - Strikethrough (GFM)
 * - Line breaks
 *
 * @param children - Array of inline mdast nodes
 * @returns Rendered HTML string (no wrapping element)
 * @public
 */
export function renderInlineContent(children: any[]): string {
	return children
		.map((child) => {
			if (child.type === 'text') {
				return escapeHtml(child.value);
			} else if (child.type === 'emphasis') {
				const text = renderInlineContent(child.children);
				return `<em>${text}</em>`;
			} else if (child.type === 'strong') {
				const text = renderInlineContent(child.children);
				return `<strong>${text}</strong>`;
			} else if (child.type === 'inlineCode') {
				return `<code>${escapeHtml(child.value)}</code>`;
			} else if (child.type === 'link') {
				const text = renderInlineContent(child.children);
				const url = escapeHtml(child.url);
				const title = child.title ? ` title="${escapeHtml(child.title)}"` : '';
				return `<a href="${url}"${title}>${text}</a>`;
			} else if (child.type === 'delete') {
				// Strikethrough support (GFM)
				const text = renderInlineContent(child.children);
				return `<del>${text}</del>`;
			} else if (child.type === 'image') {
				const alt = child.alt ? escapeHtml(child.alt) : '';
				const url = escapeHtml(child.url);
				const title = child.title ? ` title="${escapeHtml(child.title)}"` : '';
				return `<img src="${url}" alt="${alt}"${title}>`;
			} else if (child.type === 'break') {
				return '<br>';
			}
			return '';
		})
		.join('');
}
