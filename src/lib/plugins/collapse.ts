import { visit, SKIP } from 'unist-util-visit';
import type {
  Root,
  BlockContent,
  Paragraph,
  List,
  ListItem,
  Code,
  Blockquote,
  Heading,
} from 'mdast';
import type { PhrasingContent } from 'mdast';
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
 * @public
 */
export function collapsePlugin(): (tree: Root) => void {
  return (tree: Root) => {
    try {
      // Validate tree before visiting
      if (!tree || !tree.children) {
        return;
      }

      // Sanitize tree: remove any undefined/null nodes
      sanitizeTree(tree);

      visit(tree, 'containerDirective', (node: unknown) => {
        // Extra defensive checks
        if (!node) return;
        const n = node as any;
        if (typeof n.name !== 'string') return;
        if (n.name !== 'collapse') return;

        // Extract attributes
        const title = n.attributes?.title || 'Details';
        const open = n.attributes?.open !== 'false'; // "false" string means closed

        // Render nested markdown to HTML
        const contentHtml = renderChildren(n.children || []);

        // Transform to HTML
        n.type = 'html';
        n.value = `<details class="md-collapse" ${open ? 'open' : ''}>
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
        delete n.children;

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
        return renderList(child as List, 1);
      } else if (child.type === 'code') {
        const code = child as Code;
        const lang = code.lang ? ` class="language-${code.lang}"` : '';
        return `    <pre><code${lang}>${escapeHtml(code.value)}</code></pre>`;
      } else if (child.type === 'blockquote') {
        const quote = child as Blockquote;
        const quoteContent = renderChildren(quote.children as BlockContent[]);
        return `    <blockquote>\n${quoteContent}\n    </blockquote>`;
      } else if (child.type === 'heading') {
        const heading = child as Heading;
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
function renderList(list: List, depth: number): string {
  const indent = '    '.repeat(depth);
  const listType = list.ordered ? 'ol' : 'ul';
  const items = list.children
    .map((item: ListItem) => {
      const itemParts: string[] = [];
      (item.children as BlockContent[]).forEach((itemChild: BlockContent) => {
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
function renderInlineContent(children: PhrasingContent[]): string {
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
function sanitizeTree(node: unknown): void {
  if (!node || typeof node !== 'object') return;

  const obj = node as Record<string, unknown>;
  if (Array.isArray(obj.children)) {
    // Filter out undefined/null children and cast to array
    const children = obj.children.filter((child: unknown) => child != null);
    obj.children = children;
    // Recursively sanitize remaining children
    children.forEach((child: unknown) => sanitizeTree(child));
  }
}
