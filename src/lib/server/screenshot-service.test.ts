// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  createScreenshotEndpoint,
  validateUrl,
  validateScreenshotName,
  validateScreenshotVersion,
} from './screenshot-service.ts';
import { createMarkdownDocs } from '../config/defaults.ts';

// These cover the security-critical input validation and SSRF protection used by
// the screenshot endpoint. The consumer-owned allowlist is the ultimate
// default-deny gate; the private-IP / metadata / protocol checks are defense in depth.

const allowedDomains = ['docs.example.com'];

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

describe('createScreenshotEndpoint', () => {
  it('rejects disallowed CLI commands as bounded client errors', async () => {
    const endpoint = createScreenshotEndpoint(
      createMarkdownDocs({
        screenshots: {
          enabled: true,
          basePath: '/screenshots',
          cli: { allowedCommands: [] },
        },
      })
    );
    const command = 'sensitive-command '.repeat(200);
    const response = (await endpoint({
      fetch,
      getClientAddress: () => '127.0.0.1',
      request: new Request('http://127.0.0.1/api/screenshots/generate', {
        body: JSON.stringify({
          config: { command, type: 'cli' },
          name: 'cli-fixture',
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    } as Parameters<typeof endpoint>[0])) as Response;
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(JSON.parse(body)).toEqual({
      error: 'Command not allowed.',
      success: false,
    });
    expect(body).not.toContain(command);
  });
});

describe('validateUrl (SSRF protection)', () => {
  it('allows hosts on the configured allowlist and their subdomains', () => {
    expect(() => validateUrl('https://docs.example.com/page', allowedDomains)).not.toThrow();
    expect(() => validateUrl('http://sub.docs.example.com/x', allowedDomains)).not.toThrow();
  });

  it('rejects non-http(s) protocols', () => {
    for (const bad of ['ftp://docs.example.com', 'file:///etc/passwd', 'data:text/html,<x>']) {
      expect(() => validateUrl(bad, allowedDomains)).toThrow();
    }
  });

  it('rejects hosts off the allowlist, including suffix-spoofing tricks', () => {
    expect(() => validateUrl('https://evil.example.com', allowedDomains)).toThrow();
    // Must match on a domain boundary, not a bare substring/suffix.
    expect(() => validateUrl('https://docs.example.com.evil.com', allowedDomains)).toThrow();
    expect(() => validateUrl('https://notdocs.example.com', allowedDomains)).toThrow();
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
      expect(() => validateUrl(bad, allowedDomains)).toThrow();
    }
  });

  it('blocks SSRF targets even if the allowlist is misconfigured to include them', () => {
    expect(() => validateUrl('http://10.0.0.1', ['10.0.0.1'])).toThrow();
    expect(() => validateUrl('http://169.254.169.254', ['169.254.169.254'])).toThrow();
  });

  it('fails closed without a consumer allowlist', () => {
    expect(() => validateUrl('https://docs.example.com')).toThrow();
  });
});
