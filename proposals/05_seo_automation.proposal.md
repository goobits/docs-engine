# SEO Automation

## Problem

Documentation sites lack automated SEO optimization features:
- No automatic sitemap.xml generation
- No Open Graph images for social sharing
- Meta tags require manual configuration per page
- No robots.txt generation
- No canonical URL management

This results in poor search engine discoverability and unprofessional social sharing previews. Competitors (Docusaurus, VitePress) handle this automatically.

## Solution

Implement automated SEO features that generate sitemaps, OG images, and meta tags without manual configuration.

**Core Features:**
1. Auto-generate `sitemap.xml` from navigation structure
2. Auto-generate Open Graph images with page titles
3. Meta tag helper for consistent SEO metadata
4. robots.txt generation with sensible defaults
5. Canonical URL management

## Checklists

### Sitemap Generation
- [ ] Create `src/lib/server/sitemap.ts` utility
- [ ] Generate sitemap.xml from `DocsSection[]` navigation structure
- [ ] Include all documentation pages with priority and lastmod
- [ ] Add `+server.ts` endpoint at `/sitemap.xml`
- [ ] Support custom priority via frontmatter (`sitemap_priority: 0.8`)
- [ ] Support excluding pages via frontmatter (`sitemap: false`)
- [ ] Use Git last commit date for `<lastmod>` when available
- [ ] Generate proper XML with namespace declarations

### Open Graph Image Generation
- [ ] Create `src/lib/server/og-image.ts` utility
- [ ] Use Satori to generate OG images from templates
- [ ] Support custom OG image via frontmatter (`og_image: /custom.png`)
- [ ] Default template with page title, site name, and branding
- [ ] Add `+server.ts` endpoint at `/api/og/[slug].png`
- [ ] Cache generated images in `.svelte-kit/output`
- [ ] Support dark/light mode variants
- [ ] Generate at 1200x630px (Facebook/Twitter standard)

### Meta Tags Helper
- [ ] Create `MetaTags.svelte` component
- [ ] Accept `title`, `description`, `image`, `url`, `type` props
- [ ] Generate `<title>`, `<meta name="description">`, Open Graph tags, Twitter cards
- [ ] Support site-wide defaults from config
- [ ] Extract description from frontmatter or first paragraph
- [ ] Generate canonical URLs automatically
- [ ] Support custom meta tags via frontmatter

### Robots.txt Generation
- [ ] Create `+server.ts` endpoint at `/robots.txt`
- [ ] Generate sensible defaults (allow all, link to sitemap)
- [ ] Support custom rules via config
- [ ] Support disallowing pages via frontmatter (`robots: noindex`)

### Configuration
- [ ] Add `seoConfig` to docs-engine config
- [ ] Support `siteUrl` (required for absolute URLs)
- [ ] Support `siteName` (for OG images and titles)
- [ ] Support `defaultOgImage` (fallback image)
- [ ] Support `twitterHandle` (for Twitter cards)
- [ ] Support custom OG image template

### Integration
- [ ] Update `DocsLayout.svelte` to include `MetaTags` component
- [ ] Pass page metadata from server load function
- [ ] Ensure OG images work in production builds
- [ ] Test with Facebook Sharing Debugger
- [ ] Test with Twitter Card Validator

### Documentation
- [ ] Document SEO configuration in README.md
- [ ] Document frontmatter SEO fields
- [ ] Document custom OG image templates
- [ ] Document robots.txt customization
- [ ] Add guide for verifying SEO implementation

## Success Criteria

- `sitemap.xml` is automatically generated at build time
- All documentation pages have proper Open Graph metadata
- Social sharing shows custom OG images with page titles
- Meta description is extracted from frontmatter or content
- Canonical URLs prevent duplicate content issues
- robots.txt is generated with sensible defaults
- SEO score improves on Lighthouse (90+)

## Benefits

- Better search engine rankings and discoverability
- Professional social sharing previews on Twitter/LinkedIn/Slack
- Reduced manual SEO configuration work
- Consistent metadata across all pages
- Prevents duplicate content penalties
- Matches SEO capabilities of competing tools
- Makes docs-engine production-ready
