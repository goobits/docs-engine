// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  validateUrl,
  validateScreenshotName,
  validateScreenshotVersion,
} from './screenshot-service.js';

// These cover the security-critical input validation and SSRF protection used by
// the screenshot endpoint. The allowlist (default: beheremeow.app) is the ultimate
// default-deny gate; the private-IP / metadata / protocol checks are defense in depth.

describe('validateScreenshotName', () => {
  it('accepts safe names', () => {
    expect(() => validateScreenshotName('home')).not.toThrow();
    expect(() => validateScreenshotName('home-page_v2.1')).not.toThrow();
  });

  it('rejects path traversal, separators and shell metacharacters', () => {
    for (const bad of [
      '../etc/passwd',
      'a/b',
      'a\\b',
      'name with space',
      'name;rm',
      '.hidden',
      '',
    ]) {
      expect(() => validateScreenshotName(bad)).toThrow();
    }
  });
});

describe('validateScreenshotVersion', () => {
  it('accepts safe versions and rejects unsafe ones', () => {
    expect(() => validateScreenshotVersion('1.2.3')).not.toThrow();
    expect(() => validateScreenshotVersion('v2_0')).not.toThrow();
    for (const bad of ['../1', '1/2', 'a b', '']) {
      expect(() => validateScreenshotVersion(bad)).toThrow();
    }
  });
});

describe('validateUrl (SSRF protection)', () => {
  it('allows hosts on the default allowlist (and their subdomains)', () => {
    expect(() => validateUrl('https://beheremeow.app/page')).not.toThrow();
    expect(() => validateUrl('http://sub.beheremeow.app/x')).not.toThrow();
  });

  it('rejects non-http(s) protocols', () => {
    for (const bad of ['ftp://beheremeow.app', 'file:///etc/passwd', 'data:text/html,<x>']) {
      expect(() => validateUrl(bad)).toThrow();
    }
  });

  it('rejects hosts off the allowlist, including suffix-spoofing tricks', () => {
    expect(() => validateUrl('https://evil.example.com')).toThrow();
    // Must match on a domain boundary, not a bare substring/suffix.
    expect(() => validateUrl('https://beheremeow.app.evil.com')).toThrow();
    expect(() => validateUrl('https://notbeheremeow.app')).toThrow();
  });

  it('rejects private IPs, loopback and the cloud metadata endpoint', () => {
    for (const bad of [
      'http://10.0.0.1',
      'http://172.16.0.1',
      'http://192.168.1.1',
      'http://169.254.169.254',
      'http://127.0.0.1',
      'http://localhost',
    ]) {
      expect(() => validateUrl(bad)).toThrow();
    }
  });

  it('blocks SSRF targets even if the allowlist is misconfigured to include them', async () => {
    // Put the dangerous hosts ON the allowlist, then prove the defense-in-depth
    // checks still reject them (i.e. the allowlist is not the only safeguard).
    vi.stubEnv('DOCS_SCREENSHOT_ALLOWED_DOMAINS', '10.0.0.1,169.254.169.254');
    vi.resetModules();
    try {
      const fresh = await import('./screenshot-service.js');
      expect(() => fresh.validateUrl('http://10.0.0.1')).toThrow();
      expect(() => fresh.validateUrl('http://169.254.169.254')).toThrow();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
