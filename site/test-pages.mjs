/**
 * Playwright test to verify all docs pages load properly
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3391';

const PAGES_TO_TEST = [
  '/docs',
  '/docs/getting-started',
  '/docs/plugins/callouts',
  '/docs/plugins/code-highlighting',
  '/docs/plugins/code-tabs',
  '/docs/plugins/filetree',
  '/docs/plugins/mermaid',
  '/docs/plugins/navigation',
  '/docs/plugins/toc',
  '/docs/plugins/katex',
  '/docs/plugins/collapse',
  '/docs/plugins/links',
  '/docs/plugins/screenshots',
  '/docs/guides/diagrams',
  '/docs/guides/examples',
];

async function testPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n🧪 Testing DocsEngine pages...\n');

  const results = {
    passed: [],
    failed: [],
  };

  for (const path of PAGES_TO_TEST) {
    const url = `${BASE_URL}${path}`;
    try {
      console.log(`Testing: ${path}`);

      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      if (!response || response.status() !== 200) {
        throw new Error(`HTTP ${response?.status() || 'unknown'}`);
      }

      // Check for critical elements
      await page.waitForSelector('.docs-layout', { timeout: 5000 });

      // Check for errors in console
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      results.passed.push(path);
      console.log(`✅ ${path}`);
    } catch (error) {
      results.failed.push({ path, error: error.message });
      console.log(`❌ ${path} - ${error.message}`);
    }
  }

  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}/${PAGES_TO_TEST.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${PAGES_TO_TEST.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed pages:');
    results.failed.forEach(({ path, error }) => {
      console.log(`   - ${path}: ${error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All pages loaded successfully!');
  }
}

testPages().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
