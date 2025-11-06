import { visit, SKIP } from 'unist-util-visit';
import type { Root } from 'mdast';
import { escapeHtml } from '../utils/html.js';
import { renderBlockContent } from '../utils/markdown-renderer.js';

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

			visit(tree, 'containerDirective', (node: any) => {
				// Extra defensive checks
				if (!node) return;
				if (typeof node.name !== 'string') return;
				if (node.name !== 'collapse') return;

				// Extract attributes
				const title = node.attributes?.title || 'Details';
				const open = node.attributes?.open !== 'false'; // "false" string means closed

				// Render nested markdown to HTML
				const contentHtml = renderBlockContent(node.children || []);

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
