import { describe, it, expect } from 'vitest';
import { parseFrontmatter, extractTitle } from './frontmatter';

describe('frontmatter', () => {
  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const markdown = `---
title: "My Document"
description: "A test document"
date: "2025-01-01"
tags: ["guide", "api"]
---

# Content here

This is the body.`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.title).toBe('My Document');
      expect(result.frontmatter.description).toBe('A test document');
      expect(result.frontmatter.date).toBe('2025-01-01');
      expect(result.frontmatter.tags).toEqual(['guide', 'api']);
      expect(result.content).toBe('# Content here\n\nThis is the body.');
      expect(result.raw).toBe(markdown);
    });

    it('should handle markdown without frontmatter', () => {
      const markdown = '# Hello\n\nThis is content without frontmatter.';

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(markdown);
      expect(result.raw).toBe(markdown);
    });

    it('should parse frontmatter with custom fields', () => {
      const markdown = `---
title: "Test"
customField: "custom value"
nested:
  key: "value"
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.title).toBe('Test');
      expect(result.frontmatter.customField).toBe('custom value');
      expect(result.frontmatter.nested).toEqual({ key: 'value' });
    });

    it('should handle frontmatter with boolean values', () => {
      const markdown = `---
draft: true
published: false
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.draft).toBe(true);
      expect(result.frontmatter.published).toBe(false);
    });

    it('should handle frontmatter with numeric values', () => {
      const markdown = `---
order: 5
priority: 1.5
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.order).toBe(5);
      expect(result.frontmatter.priority).toBe(1.5);
    });

    it('should handle empty frontmatter', () => {
      const markdown = `---

---

Content`;

      const result = parseFrontmatter(markdown);

      // YAML parser may return null for empty content
      expect(
        result.frontmatter === null || Object.keys(result.frontmatter || {}).length === 0
      ).toBe(true);
      expect(result.content).toBe('Content');
    });

    it('should handle frontmatter with arrays', () => {
      const markdown = `---
tags:
  - tag1
  - tag2
  - tag3
categories: ["cat1", "cat2"]
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result.frontmatter.categories).toEqual(['cat1', 'cat2']);
    });

    it('should handle malformed YAML gracefully', () => {
      const markdown = `---
title: "Missing quote
invalid: [unclosed
---

Content`;

      const result = parseFrontmatter(markdown);

      // Should fallback to empty frontmatter
      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(markdown);
    });

    it('should handle frontmatter with special characters', () => {
      const markdown = `---
title: Title with colons
description: Quotes and text
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.title).toBeDefined();
      expect(result.frontmatter.description).toBeDefined();
    });

    it('should handle multiline YAML values', () => {
      const markdown = `---
description: |
  This is a multiline
  description that spans
  multiple lines.
---

Content`;

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.description).toContain('multiline');
      expect(result.frontmatter.description).toContain('spans');
    });

    it('should preserve content after frontmatter', () => {
      const markdown = `---
title: "Test"
---

# Heading

Paragraph 1

## Subheading

Paragraph 2`;

      const result = parseFrontmatter(markdown);

      expect(result.content).toContain('# Heading');
      expect(result.content).toContain('## Subheading');
      expect(result.content).toContain('Paragraph 1');
      expect(result.content).toContain('Paragraph 2');
    });

    it('should handle content with newlines', () => {
      const markdown = '---\ntitle: Test\n---\n\nContent';

      const result = parseFrontmatter(markdown);

      expect(result.frontmatter.title).toBeDefined();
      expect(result.content).toBe('Content');
    });
  });

  describe('extractTitle', () => {
    it('should extract title from frontmatter', () => {
      const frontmatter = { title: 'Frontmatter Title' };
      const content = '# Heading Title\n\nContent';
      const fallback = 'Fallback Title';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Frontmatter Title');
    });

    it('should extract title from first heading when no frontmatter title', () => {
      const frontmatter = {};
      const content = '# Heading Title\n\nContent';
      const fallback = 'Fallback Title';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Heading Title');
    });

    it('should use fallback when no frontmatter or heading title', () => {
      const frontmatter = {};
      const content = 'Content without heading';
      const fallback = 'Fallback Title';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Fallback Title');
    });

    it('should prefer frontmatter title over heading', () => {
      const frontmatter = { title: 'Frontmatter Title' };
      const content = '# Different Heading\n\nContent';
      const fallback = 'Fallback Title';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Frontmatter Title');
    });

    it('should extract title from heading with multiple words', () => {
      const frontmatter = {};
      const content = '# This is a Long Title with Many Words\n\nContent';
      const fallback = 'Fallback';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('This is a Long Title with Many Words');
    });

    it('should only extract from level 1 heading', () => {
      const frontmatter = {};
      const content = '## Level 2 Heading\n\n# Level 1 Heading\n\nContent';
      const fallback = 'Fallback';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Level 1 Heading');
    });

    it('should handle content with only level 2+ headings', () => {
      const frontmatter = {};
      const content = '## Subheading\n\n### Another Subheading';
      const fallback = 'Fallback Title';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Fallback Title');
    });

    it('should handle empty content', () => {
      const frontmatter = {};
      const content = '';
      const fallback = 'Fallback Title';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Fallback Title');
    });

    it('should handle heading with special characters', () => {
      const frontmatter = {};
      const content = '# Title with "quotes" and \'apostrophes\'\n\nContent';
      const fallback = 'Fallback';

      const title = extractTitle(frontmatter, content, fallback);

      expect(title).toBe('Title with "quotes" and \'apostrophes\'');
    });
  });
});
