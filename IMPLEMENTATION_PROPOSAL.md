# Implementation Proposal: Security & Performance Fixes

**Project:** @goobits/docs-engine
**Date:** 2025-11-06
**Branch:** claude/docs-engine-security-audit-011CUsQ9t75sXQp2xgit5uSv
**Verification Status:** 92% of audit findings confirmed (17/21 issues verified)

---

## Executive Summary

This proposal outlines a measured, systematic approach to resolving **17 confirmed issues** across 4 categories:
- **Security:** 6 critical vulnerabilities (MUST FIX)
- **Performance:** 4 confirmed bottlenecks (3-5x improvement potential)
- **Infrastructure:** 3 missing quality tools
- **Architecture:** 4 maintainability issues

**Estimated Effort:** 3-4 weeks total
**Phase 1 Critical Path:** 2-3 weeks (security + quick wins)
**Deployment Strategy:** Incremental - security first, then optimizations

---

## Scope & Non-Goals

### IN SCOPE ✅
- Fix all 6 critical security vulnerabilities
- Implement 4 high-impact performance optimizations
- Setup quality tooling (ESLint, Prettier, pre-commit hooks)
- Add retry logic and rate limiting
- Update outdated dependencies
- Improve test coverage baseline

### OUT OF SCOPE ❌
- Complete architectural refactoring (split god class) - **Future work**
- Comprehensive component rewrites - **Incremental approach only**
- UI/UX changes - **No visual changes**
- Breaking API changes - **Backward compatible only**

---

## Implementation Plan by Sector

### SECTOR 1: Security Fixes (Priority P0)

**Owner:** Security Agent
**Estimated Effort:** 5-7 days
**Files Modified:** 10 files

#### 1.1 XSS Vulnerability Mitigation (CRITICAL)
**Approach:** Install DOMPurify + sanitize all innerHTML usage

**Rationale:**
- Quick win (2-3 days vs 5-7 days for mount() API refactor)
- Battle-tested library (8M+ weekly downloads)
- Non-breaking change
- Can refactor to mount() API later if needed

**Implementation:**
```typescript
// Install DOMPurify
npm install dompurify
npm install -D @types/dompurify

// Create sanitization utility
// src/lib/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['svg', 'g', 'path', 'rect', 'text', 'mark', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'id', 'd', 'fill', 'stroke', 'viewBox', 'xmlns']
  });
}
```

**Files to Update:**
1. `src/lib/components/MermaidHydrator.svelte` (3 instances)
2. `src/lib/components/FileTreeHydrator.svelte` (1 instance)
3. `src/lib/components/CodeTabsHydrator.svelte` (1 instance)
4. `src/lib/components/ScreenshotHydrator.svelte` (1 instance)
5. `src/lib/components/OpenAPIHydrator.svelte` (2 instances)
6. `src/lib/components/Mermaid.svelte` (2 instances)
7. `src/lib/components/SearchModal.svelte` (2 instances)

**Testing:**
- Add XSS payload tests for each hydrator
- Verify legitimate content still renders correctly
- Test error message sanitization

#### 1.2 SSRF Protection (CRITICAL)
**Approach:** URL allowlist validation

**Implementation:**
```typescript
// src/lib/server/screenshot-service.ts
const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'docs.anthropic.com',
  'claude.ai',
  // Add production domains
];

function validateUrl(url: string): void {
  const parsed = new URL(url);

  // Block private IP ranges
  if (/^(10|172\.(1[6-9]|2[0-9]|3[01])|192\.168)\./.test(parsed.hostname)) {
    throw new Error('Private IP addresses are not allowed');
  }

  // Block cloud metadata
  if (parsed.hostname === '169.254.169.254') {
    throw new Error('Cloud metadata endpoint access denied');
  }

  // Allowlist check
  const isAllowed = ALLOWED_DOMAINS.some(domain =>
    parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
  );

  if (!isAllowed) {
    throw new Error(`Domain ${parsed.hostname} is not in allowlist`);
  }
}
```

**Testing:**
- Attempt internal network access (should fail)
- Attempt cloud metadata access (should fail)
- Verify allowed domains work

#### 1.3 Path Traversal Prevention (CRITICAL)
**Approach:** Path canonicalization + jail directory

**Implementation:**
```typescript
// src/lib/server/image-processor.ts
import path from 'path';
import { fileURLToPath } from 'url';

function validatePath(inputPath: string, allowedBaseDir: string): string {
  const canonical = path.resolve(inputPath);
  const baseCanonical = path.resolve(allowedBaseDir);

  if (!canonical.startsWith(baseCanonical)) {
    throw new Error(`Path traversal detected: ${inputPath}`);
  }

  return canonical;
}

// Usage:
const safePath = validatePath(inputPath, config.baseDir);
const sharpInstance = sharp(safePath);
```

**Testing:**
- Attempt `../../etc/passwd` access (should fail)
- Attempt `../../../.env` access (should fail)
- Verify legitimate paths work

#### 1.4 Security Headers (HIGH)
**Approach:** SvelteKit hooks.server.ts

**Implementation:**
```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:;"
  );
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS (only in production)
  if (event.url.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};
```

**Testing:**
- Run securityheaders.com scan (target: A+ rating)
- Verify CSP doesn't break functionality

#### 1.5 Rate Limiting (MEDIUM)
**Approach:** Simple in-memory rate limiter with sliding window

**Implementation:**
```typescript
// src/lib/server/rate-limiter.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limiter = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = limiter.get(identifier);

  if (!entry || now > entry.resetAt) {
    limiter.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limiter.entries()) {
    if (now > entry.resetAt) {
      limiter.delete(key);
    }
  }
}, 60000);
```

**Usage in hooks.server.ts:**
```typescript
// Rate limit screenshot endpoint
if (event.url.pathname.startsWith('/api/screenshots')) {
  const ip = event.getClientAddress();
  if (!checkRateLimit(ip, 10, 60000)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
}
```

**Testing:**
- Send 15 requests in 60s (should block after 10)
- Wait 60s, verify reset works

#### 1.6 Mermaid Security Hardening (MEDIUM)
**Approach:** Change securityLevel to 'strict'

**Implementation:**
```typescript
// src/lib/components/MermaidHydrator.svelte:129
// src/lib/components/Mermaid.svelte:111
mermaid.initialize({
  startOnLoad: false,
  theme: theme,
  securityLevel: 'strict',  // Changed from 'loose'
  logLevel: 'error'
});
```

**Testing:**
- Verify diagrams still render
- Verify click handlers work via custom modal (already implemented)

---

### SECTOR 2: Performance Optimizations (Priority P1)

**Owner:** Performance Agent
**Estimated Effort:** 1-2 days
**Files Modified:** 3 files

#### 2.1 Parallelize Image Processing (HIGH IMPACT)
**Expected Improvement:** 3-5x faster builds with images

**Implementation:**
```typescript
// Install p-limit
npm install p-limit

// src/lib/server/image-processor.ts:279-290
import pLimit from 'p-limit';
import os from 'os';

export async function batchProcessImages(
  configs: ImageProcessorConfig[]
): Promise<ImageProcessorResult[]> {
  const limit = pLimit(os.cpus().length);

  const results = await Promise.all(
    configs.map(config =>
      limit(async () => {
        try {
          return await processImage(config);
        } catch (error) {
          console.error(`Failed to process image ${config.inputPath}:`, error);
          throw error;
        }
      })
    )
  );

  return results;
}
```

**Testing:**
- Benchmark with 20 images: before vs after
- Verify all images processed correctly
- Test error handling (one failed image shouldn't block others)

#### 2.2 Fix O(n²) Navigation Sorting (CRITICAL for large sites)
**Expected Improvement:** 500ms → <100ms for 500 page sites

**Implementation:**
```typescript
// src/lib/utils/navigation-builder.ts:206-233

// Pre-compute order map (O(n) space, O(1) lookup)
const orderMap = new Map(docs.map(d => [d.href, d.order ?? 999]));

// O(n log n) sort instead of O(n² log n)
const sortedLinks = links.sort((a, b) => {
  const orderA = orderMap.get(a.href) ?? 999;
  const orderB = orderMap.get(b.href) ?? 999;
  return orderA - orderB;
});

// Same optimization for sections
sections.sort((a, b) => {
  const minOrderA = Math.min(
    ...a.links.map(link => orderMap.get(link.href) ?? 999)
  );
  const minOrderB = Math.min(
    ...b.links.map(link => orderMap.get(link.href) ?? 999)
  );
  return minOrderA - minOrderB;
});
```

**Testing:**
- Benchmark with 500 docs
- Verify navigation order correct
- Test edge cases (undefined order, duplicate orders)

#### 2.3 Fix Git Cache Memory Leak (MEDIUM)
**Expected Improvement:** Stable memory on long builds

**Implementation:**
```typescript
// Install lru-cache
npm install lru-cache

// src/lib/utils/git.ts:48
import { LRUCache } from 'lru-cache';

const gitCache = new LRUCache<string, { value: string; timestamp: number }>({
  max: 1000,              // Max 1000 entries
  ttl: 60000,             // 60 second TTL
  updateAgeOnGet: true    // Refresh TTL on access
});

function execGitCommand(command: string, cacheKey: string, ttl = 60000): string | null {
  const cached = gitCache.get(cacheKey);
  if (cached) {
    return cached.value;
  }

  // ... execute command ...

  gitCache.set(cacheKey, { value: result, timestamp: Date.now() });
  return result;
}
```

**Testing:**
- Build large site, monitor memory usage
- Verify cache eviction works (check size <= 1000)
- Benchmark: cache hit ratio should be >80%

#### 2.4 Add Retry Logic (MEDIUM)
**Expected Improvement:** More resilient builds

**Implementation:**
```typescript
// Install p-retry
npm install p-retry

// src/lib/server/screenshot-service.ts
import pRetry from 'p-retry';

// Wrap fetch calls
const response = await pRetry(
  () => fetch(url, { timeout: 10000 }),
  {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    onFailedAttempt: error => {
      console.warn(`Screenshot attempt ${error.attemptNumber} failed: ${error.message}`);
    }
  }
);

// src/lib/utils/git.ts
// Wrap git commands
const result = pRetry(
  () => execSync(command, { encoding: 'utf-8', timeout: 10000 }),
  {
    retries: 2,
    minTimeout: 500,
    onFailedAttempt: error => {
      if (error.message.includes('lock')) {
        // Git lock file issue - retry
        return;
      }
      throw error; // Don't retry other errors
    }
  }
);
```

**Testing:**
- Simulate transient failures (network blips, git locks)
- Verify retries work with exponential backoff
- Verify non-retriable errors fail fast

---

### SECTOR 3: Infrastructure & Tooling (Priority P1)

**Owner:** Infrastructure Agent
**Estimated Effort:** 1 day
**Files Modified:** 5 config files + package.json

#### 3.1 ESLint Configuration
**Implementation:**
```bash
npm install -D \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-svelte \
  svelte-eslint-parser \
  eslint-config-prettier \
  eslint-plugin-security
```

**Config file: `eslint.config.js`**
```javascript
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import security from 'eslint-plugin-security';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security: security
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...security.configs.recommended.rules,

      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-implied-eval': 'error',

      // Code quality
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser
      }
    },
    plugins: {
      svelte: sveltePlugin
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      'svelte/no-at-html-tags': 'error',  // Prevent @html without review
      'svelte/no-inner-html': 'warn'       // Warn on innerHTML usage
    }
  },
  {
    ignores: ['dist/', 'build/', '.svelte-kit/', 'node_modules/']
  }
];
```

**Add to package.json:**
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

#### 3.2 Prettier Configuration
**Implementation:**
```bash
npm install -D prettier prettier-plugin-svelte
```

**Config file: `.prettierrc.json`**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

**Ignore file: `.prettierignore`**
```
dist/
build/
.svelte-kit/
node_modules/
*.md
pnpm-lock.yaml
package-lock.json
```

**Add to package.json:**
```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

#### 3.3 Pre-commit Hooks (Husky + lint-staged)
**Implementation:**
```bash
npm install -D husky lint-staged
npx husky init
```

**Create: `.husky/pre-commit`**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Add to package.json:**
```json
{
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.svelte": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

#### 3.4 Renovate Configuration
**Implementation:**
```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["before 3am on Monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["minor"],
      "groupName": "minor dependencies",
      "schedule": ["before 3am on the first day of the month"]
    },
    {
      "matchUpdateTypes": ["major"],
      "groupName": "major dependencies",
      "schedule": ["before 3am on the first day of the month"],
      "labels": ["major-update"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  }
}
```

**Immediate Update:**
```bash
npm install remark-directive@^4.0.0
```

---

### SECTOR 4: Architecture Improvements (Priority P2)

**Owner:** Architecture Agent
**Estimated Effort:** 2-3 days
**Files Modified:** Multiple (test files, utils)

#### 4.1 Increase Test Coverage (Target: 40% baseline)
**Approach:** Add integration tests for critical paths

**New test files to create:**
1. `src/lib/server/screenshot-service.test.ts` - Screenshot generation
2. `src/lib/utils/markdown.test.ts` - Markdown processing
3. `src/lib/components/hydrators.test.ts` - Hydrator components
4. `src/lib/server/rate-limiter.test.ts` - Rate limiting

**Update vitest.config.ts:**
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/lib/**/*.svelte'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40
      }
    }
  }
});
```

**Add to package.json:**
```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

#### 4.2 Extract Sanitization Utility
**Create centralized sanitization:**
```typescript
// src/lib/utils/sanitize.ts
import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export function sanitizeHtml(html: string, options?: SanitizeOptions): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options?.allowedTags || ['mark', 'span', 'div'],
    ALLOWED_ATTR: options?.allowedAttributes || ['class', 'id']
  });
}

export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    ALLOWED_TAGS: ['svg', 'g', 'path', 'rect', 'text', 'circle', 'line', 'polyline', 'polygon'],
    ALLOWED_ATTR: ['class', 'id', 'd', 'fill', 'stroke', 'viewBox', 'xmlns', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'points']
  });
}

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // Escape HTML entities in error messages
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

#### 4.3 Add JSDoc to High-Traffic Files
**Target files:**
- `src/lib/utils/markdown.ts` (0/6 documented)
- `src/lib/utils/html.ts` (0/3 documented)
- `src/lib/utils/file-io.ts` (0/5 documented)

**Example:**
```typescript
/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @param options - Optional configuration for allowed tags/attributes
 * @returns Sanitized HTML safe for rendering
 * @example
 * ```typescript
 * sanitizeHtml('<script>alert("xss")</script>') // Returns empty string
 * sanitizeHtml('<div>Safe content</div>') // Returns '<div>Safe content</div>'
 * ```
 */
export function sanitizeHtml(html: string, options?: SanitizeOptions): string {
  // ...
}
```

---

## Testing Strategy

### Unit Tests
- [ ] XSS sanitization tests (8 test cases)
- [ ] SSRF URL validation tests (10 test cases)
- [ ] Path traversal tests (8 test cases)
- [ ] Rate limiting tests (5 test cases)
- [ ] Performance optimization benchmarks (4 test cases)

### Integration Tests
- [ ] Screenshot generation end-to-end
- [ ] Markdown processing pipeline
- [ ] Navigation building with 500 docs
- [ ] Image processing with 20 images

### Security Tests
- [ ] DAST scan with OWASP ZAP
- [ ] Penetration test SSRF endpoint
- [ ] XSS payload fuzzing (100 payloads)
- [ ] Security headers validation (securityheaders.com)

### Performance Benchmarks
```bash
# Before optimizations
npm run benchmark

# After optimizations
npm run benchmark

# Expected improvements:
# - Image processing: 3-5x faster
# - Navigation build: 5-10x faster on large sites
# - Memory usage: Stable (no growth)
```

---

## Rollout Plan

### Phase 1: Security Fixes (Week 1-2)
**Goal:** All 6 critical security issues resolved

**Day 1-2:**
- Install DOMPurify, create sanitization utility
- Fix XSS in all 8 files
- Add XSS tests

**Day 3:**
- Add SSRF protection with URL allowlist
- Add path traversal protection
- Add security tests

**Day 4:**
- Create hooks.server.ts with security headers
- Add rate limiting
- Change Mermaid securityLevel

**Day 5-7:**
- Run full security audit (DAST, penetration test)
- Fix any issues found
- Document security features

**Deliverable:**
- ✅ All XSS vulnerabilities fixed
- ✅ SSRF and path traversal protected
- ✅ Security headers implemented
- ✅ Rate limiting active
- ✅ Security test suite passing

### Phase 2: Infrastructure Setup (Week 2)
**Goal:** Quality tooling configured and active

**Day 1:**
- Install and configure ESLint
- Install and configure Prettier
- Fix all auto-fixable linting issues

**Day 2:**
- Setup Husky + lint-staged
- Test pre-commit hooks
- Configure Renovate
- Update remark-directive

**Deliverable:**
- ✅ Zero ESLint errors
- ✅ Code formatted consistently
- ✅ Pre-commit hooks working
- ✅ Renovate PRs created for outdated deps

### Phase 3: Performance Optimizations (Week 3)
**Goal:** 3-5x faster builds

**Day 1:**
- Parallelize image processing
- Fix navigation sorting
- Benchmark improvements

**Day 2:**
- Fix git cache with LRU
- Add retry logic
- Benchmark memory usage

**Day 3:**
- Integration testing
- Performance regression tests
- Documentation

**Deliverable:**
- ✅ 3-5x faster image processing
- ✅ <100ms navigation build (500 docs)
- ✅ Stable memory usage
- ✅ Retry logic on transient failures

### Phase 4: Architecture & Testing (Week 3-4)
**Goal:** 40% test coverage baseline

**Day 1-2:**
- Write integration tests
- Add JSDoc to high-traffic files
- Extract reusable utilities

**Day 3:**
- Run full test suite
- Configure coverage thresholds
- Document testing approach

**Deliverable:**
- ✅ 40% test coverage
- ✅ Integration tests for critical paths
- ✅ Coverage gates in CI

---

## Success Metrics

### Security (Target: A+ Rating)
- [ ] Zero XSS vulnerabilities (DAST scan)
- [ ] SSRF protection validated (penetration test)
- [ ] Path traversal blocked (fuzzing test)
- [ ] Security headers: A+ on securityheaders.com
- [ ] Rate limiting: 429 response after limit exceeded

### Performance (Target: 3-5x Improvement)
- [ ] Image processing: <20% of original time
- [ ] Navigation build: <100ms for 500 pages
- [ ] Memory usage: No growth over 1hr build
- [ ] Cache hit ratio: >80%

### Code Quality (Target: Industry Standard)
- [ ] ESLint: Zero errors
- [ ] Prettier: 100% formatted
- [ ] Test coverage: >40%
- [ ] Pre-commit hooks: Active on all commits
- [ ] Dependencies: 100% up-to-date

---

## Risk Mitigation

### Risk 1: DOMPurify breaks legitimate content
**Mitigation:**
- Comprehensive testing with real documentation
- Configurable allowed tags per use case
- Fallback to escapeHtml if needed

### Risk 2: URL allowlist too restrictive
**Mitigation:**
- Make allowlist configurable via environment variables
- Document how to add domains
- Provide wildcard support (*.anthropic.com)

### Risk 3: Performance optimizations cause bugs
**Mitigation:**
- Extensive benchmarking before/after
- Integration tests for each optimization
- Feature flags for gradual rollout

### Risk 4: Pre-commit hooks slow down development
**Mitigation:**
- Only lint/format changed files (lint-staged)
- Keep hook execution <5 seconds
- Allow bypass with --no-verify for emergencies

---

## Backward Compatibility

### Breaking Changes: NONE ✅
All changes are backward compatible:
- Sanitization is transparent to consumers
- Security headers are additive
- Performance optimizations don't change APIs
- Tooling is development-only

### Configuration Changes
New optional environment variables:
- `SCREENSHOT_ALLOWED_DOMAINS` - CSV list of allowed domains
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 10)

---

## Documentation Updates

### Files to Create/Update:
1. **SECURITY.md** - Document security features and best practices
2. **CONTRIBUTING.md** - Update with ESLint/Prettier/pre-commit requirements
3. **README.md** - Add badges (security, coverage, build status)
4. **ARCHITECTURE.md** - Update with new sanitization utility
5. **CHANGELOG.md** - Document all changes

---

## Post-Implementation Checklist

### Before Merge:
- [ ] All tests passing (unit + integration)
- [ ] Zero ESLint errors
- [ ] Code formatted with Prettier
- [ ] Test coverage >40%
- [ ] Security scan passed (DAST)
- [ ] Performance benchmarks improved by 3x+
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### After Merge:
- [ ] Deploy to staging
- [ ] Run full security audit on staging
- [ ] Performance testing on staging
- [ ] Monitor for 24 hours
- [ ] Deploy to production
- [ ] Post-deployment smoke tests

---

## Agent Assignment

### Agent 1: Security (CRITICAL PATH)
**Files:** 10 Svelte components, 2 server utilities, 1 hooks file
**Estimated Time:** 5-7 days
**Dependencies:** None (can start immediately)

### Agent 2: Performance
**Files:** 3 utility files
**Estimated Time:** 1-2 days
**Dependencies:** None (can run in parallel with Security)

### Agent 3: Infrastructure
**Files:** 5 config files, package.json
**Estimated Time:** 1 day
**Dependencies:** None (can run in parallel)

### Agent 4: Architecture
**Files:** Multiple test files, utility documentation
**Estimated Time:** 2-3 days
**Dependencies:** Needs Security Agent's sanitization utility

---

## Budget

### Dependencies Added:
- `dompurify` + `@types/dompurify` (~10KB gzipped)
- `p-limit` (~1KB)
- `p-retry` (~1KB)
- `lru-cache` (~3KB)
- Dev dependencies: ESLint, Prettier, Husky, lint-staged (~5MB dev only)

**Total production bundle impact:** ~15KB gzipped

### Development Time:
- Security Agent: 5-7 days
- Performance Agent: 1-2 days
- Infrastructure Agent: 1 day
- Architecture Agent: 2-3 days

**Total Effort:** ~10-13 days (2-3 weeks calendar time with parallelization)

---

## Approval & Sign-off

**Proposal Status:** Ready for Review
**Approval Required:** Yes
**Estimated Start Date:** 2025-11-06
**Estimated Completion:** 2025-11-27

---

**END OF PROPOSAL**
