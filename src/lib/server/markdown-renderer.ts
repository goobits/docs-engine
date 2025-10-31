import { marked } from 'marked';
import { codeToHtml } from 'shiki';
import type { MarkdownDocsConfig } from '../config/defaults.js';
import type { MarkdownRenderer } from './types.js';
import { encodeBase64 } from '../utils/base64.js';
import { parseTree } from '../utils/tree-parser.js';

/**
 * Creates a markdown renderer with syntax highlighting support
 * @param config - Configuration options for markdown rendering
 * @returns A renderer instance with a render method
 */
export function createMarkdownRenderer(config: MarkdownDocsConfig): MarkdownRenderer {
  // Configure marked with user options
  marked.setOptions({
    gfm: config.markdown.gfm,
    breaks: config.markdown.breaks,
    async: true,
  });

  // Custom renderer for code blocks with Shiki
  const renderer = new marked.Renderer();

  renderer.code = function (code: string, infostring: string | undefined, _escaped: boolean) {
    const language = infostring?.split(/\s+/)[0];

    if (language?.startsWith('tabs:')) {
      const tabsId = language.replace('tabs:', '');
      const tabs = parseTabsContent(code);

      if (tabs.length > 0) {
        const encoded = encodeBase64(JSON.stringify(tabs));
        return `<div class="md-code-tabs" data-tabs-id="${escapeHtml(tabsId)}" data-tabs="${encoded}"></div>`;
      }
    }

    if (language === 'filetree') {
      const treeData = parseTree(code);
      const encoded = encodeBase64(JSON.stringify(treeData));
      return `<div class="md-filetree" data-tree="${encoded}"></div>`;
    }

    if (language === 'mermaid') {
      const encoded = encodeBase64(code);
      return `<div class="md-mermaid" data-diagram="${encoded}"></div>`;
    }

    if (language?.startsWith('callout:')) {
      const type = language.replace('callout:', '');
      return `<div class="md-callout" data-type="${escapeHtml(type)}">${escapeHtml(code)}</div>`;
    }

    // Return a placeholder that we'll replace later
    // We need to do this because marked's renderer isn't async-friendly
    return `__SHIKI_CODE_BLOCK__${JSON.stringify({ code, language })}__END__`;
  };

  marked.use({ renderer });

  /**
   * Highlights code blocks using Shiki
   * @param html - HTML string with code block placeholders
   * @returns HTML with highlighted code blocks
   */
  async function highlightCodeBlocks(html: string): Promise<string> {
    const codeBlockRegex = /__SHIKI_CODE_BLOCK__(.+?)__END__/g;
    const matches = Array.from(html.matchAll(codeBlockRegex));

    let result = html;
    for (const match of matches) {
      try {
        const { code, language } = JSON.parse(match[1]);
        const highlighted = await codeToHtml(code, {
          lang: language || 'text',
          theme: config.markdown.theme,
        });
        result = result.replace(match[0], highlighted);
      } catch (err) {
        console.error('Failed to highlight code block:', err);
        // Fallback to basic pre/code if highlighting fails
        const { code, language } = JSON.parse(match[1]);
        result = result.replace(
          match[0],
          `<pre><code class="language-${language || 'text'}">${code}</code></pre>`
        );
      }
    }

    return result;
  }

  return {
    async render(markdown: string): Promise<string> {
      // Parse markdown to HTML
      let html = await marked.parse(markdown);

      // Replace code block placeholders with Shiki-highlighted HTML
      html = await highlightCodeBlocks(html);

      return html;
    },
  };
}

interface Tab {
  label: string;
  content: string;
  language?: string;
}

function parseTabsContent(content: string): Tab[] {
  const tabs: Tab[] = [];
  const lines = content.split('\n');

  let currentLabel: string | null = null;
  let currentLanguage: string | undefined;
  let currentContent: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('tab:')) {
      if (currentLabel && currentContent.length > 0) {
        tabs.push({
          label: currentLabel,
          content: currentContent.join('\n').trim(),
          language: currentLanguage,
        });
      }

      currentLabel = line.replace(/^tab:\s*/, '').trim();
      currentContent = [];
      currentLanguage = undefined;
      inCodeBlock = false;
    } else if (trimmed === '---') {
      continue;
    } else if (trimmed.startsWith('```') && !inCodeBlock) {
      inCodeBlock = true;
      const lang = trimmed.slice(3).trim();
      if (lang) currentLanguage = lang;
    } else if (trimmed === '```' && inCodeBlock) {
      inCodeBlock = false;
    } else if (inCodeBlock) {
      currentContent.push(line);
    }
  }

  if (currentLabel && currentContent.length > 0) {
    tabs.push({
      label: currentLabel,
      content: currentContent.join('\n').trim(),
      language: currentLanguage,
    });
  }

  return tabs;
}

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}
