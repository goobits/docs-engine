import { visit, SKIP } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, BlockContent, Paragraph } from 'mdast';
import { escapeHtml } from '../utils/html.js';

/**
 * Remark plugin to transform :::collapse directives to HTML <details> elements
 *
 * Transforms directives like:
 * :::collapse{title="Section Title" open=true}
 * Content here...
 * :::
 *
 * Into interactive collapsible sections with:
 * - Native <details>/<summary> elements
 * - Smooth animations (CSS-based)
 * - Chevron icon rotation
 * - Accessible keyboard navigation
 */
export function collapsePlugin() {
  return (tree: Root) => {
    try {
      // Validate tree before visiting
      if (!tree || !tree.children) {
        return;
      }

      // Sanitize tree: remove any undefined/null nodes
      sanitizeTree(tree);

      visit(tree, 'containerDirective', (node: any) => {
        // Extra defensive checks
        if (!node) return;
        if (typeof node.name !== 'string') return;
        if (node.name !== 'collapse') return;

        // Extract attributes
        const title = node.attributes?.title || 'Details';
        const open = node.attributes?.open !== 'false'; // "false" string means closed

        // Render nested markdown to HTML
        const contentHtml = renderChildren(node.children || []);

        // Transform to HTML
        node.type = 'html';
        node.value = `<details class="md-collapse" ${open ? 'open' : ''}>
  <summary class="md-collapse__summary">
    <svg class="md-collapse__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="md-collapse__title">${escapeHtml(title)}</span>
  </summary>
  <div class="md-collapse__content">
${contentHtml}
  </div>
</details>`;
        delete node.children;

        // Return SKIP to prevent visiting children of the transformed node
        return SKIP;
      });
    } catch (error) {
      // If visit fails, log the error but don't crash the entire build
      console.error('Error in collapsePlugin:', error);
    }
  };
}

/**
 * Render children to HTML
 * Enhanced markdown-to-HTML for common elements with nested support
 */
function renderChildren(children: BlockContent[]): string {
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
        const quoteContent = renderChildren(quote.children);
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
 * Render list with support for nested lists
 */
function renderList(list: any, depth: number): string {
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
 * Render inline content (text, emphasis, strong, code, links, strikethrough, etc.)
 */
function renderInlineContent(children: any[]): string {
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

/**
 * Recursively remove undefined/null nodes from the AST tree
 */
function sanitizeTree(node: any): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node.children)) {
    // Filter out undefined/null children
    node.children = node.children.filter((child: any) => child != null);
    // Recursively sanitize remaining children
    node.children.forEach((child: any) => sanitizeTree(child));
  }
}
