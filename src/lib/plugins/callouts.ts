import { visit } from 'unist-util-visit';
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
 * Callout configuration
 */
interface CalloutConfig {
  icon: string;
  color: string;
  label: string;
}

/**
 * Supported callout types matching GitHub/Obsidian syntax
 */
const CALLOUT_TYPES: Record<string, CalloutConfig> = {
  NOTE: { icon: 'ℹ️', color: 'blue', label: 'Note' },
  TIP: { icon: '💡', color: 'green', label: 'Tip' },
  IMPORTANT: { icon: '❗', color: 'purple', label: 'Important' },
  WARNING: { icon: '⚠️', color: 'yellow', label: 'Warning' },
  CAUTION: { icon: '🔥', color: 'red', label: 'Caution' },
  SUCCESS: { icon: '✅', color: 'success', label: 'Success' },
  DANGER: { icon: '🚨', color: 'danger', label: 'Danger' },
  INFO: { icon: '💬', color: 'info', label: 'Info' },
  QUESTION: { icon: '❓', color: 'question', label: 'Question' },
};

/**
 * Remark plugin to transform GitHub/Obsidian-style callouts
 *
 * Transforms blockquotes like:
 * > [!NOTE]
 * > This is a note
 *
 * Or with custom titles:
 * > [!TIP] Custom Title Here
 * > This is a tip with a custom title
 *
 * Supports: NOTE, TIP, IMPORTANT, WARNING, CAUTION, SUCCESS, DANGER, INFO, QUESTION
 *
 * Into styled HTML callouts with icons and enhanced markdown rendering
 * @public
 */
export function calloutsPlugin(): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const firstChild = node.children?.[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;

      const firstText = firstChild.children?.[0];
      if (!firstText || firstText.type !== 'text') return;

      // Match [!TYPE] or [!TYPE Custom Title] syntax (case insensitive)
      const match = firstText.value.match(
        /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SUCCESS|DANGER|INFO|QUESTION)\](?:\s+(.+?))?$/i
      );
      if (!match) return;

      const type = match[1].toUpperCase() as keyof typeof CALLOUT_TYPES;
      const config = CALLOUT_TYPES[type];
      const customTitle = match[2]?.trim();

      // Use custom title if provided, otherwise use default label
      const displayTitle = customTitle || config.label;

      // Remove the entire first paragraph (it contains the [!TYPE] marker)
      node.children.shift();

      // Convert blockquote content to HTML
      const contentHtml = renderCalloutContent(node.children);

      // Transform node to HTML
      node.type = 'html';
      node.value = `<div class="md-callout md-callout--${config.color}" role="note" aria-label="${displayTitle}">
  <div class="md-callout__header">
    <span class="md-callout__icon" aria-hidden="true">${config.icon}</span>
    <span class="md-callout__label">${displayTitle}</span>
  </div>
  <div class="md-callout__content">
${contentHtml}
  </div>
</div>`;
      delete node.children;
    });
  };
}

/**
 * Render callout content to HTML
 * Enhanced markdown-to-HTML for common elements with nested support
 */
function renderCalloutContent(children: BlockContent[]): string {
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
        const quoteContent = renderCalloutContent(quote.children);
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
      item.children.forEach((itemChild: BlockContent) => {
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
