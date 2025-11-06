import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { renderBlockContent } from '../utils/markdown-renderer.js';

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
	QUESTION: { icon: '❓', color: 'question', label: 'Question' }
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
 */
export function calloutsPlugin() {
	return (tree: Root) => {
		visit(tree, 'blockquote', (node: any) => {
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
			const contentHtml = renderBlockContent(node.children);

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

