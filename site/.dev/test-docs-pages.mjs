import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3392';

async function testDocsPages() {
  console.log('🚀 Starting Playwright tests for docs pages...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const tests = [
    { path: '/docs', title: 'Documentation' },
    { path: '/docs/getting-started', title: 'Getting Started' },
    { path: '/docs/plugins/callouts', title: 'Callouts' },
    { path: '/docs/plugins/code-highlighting', title: 'Code Highlighting' },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.path}`);
      const response = await page.goto(`${BASE_URL}${test.path}`, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for content to be rendered
      await page.waitForSelector('article.docs-content', { timeout: 5000 });

      // Check if title exists
      const title = await page.title();
      console.log(`  ✅ Status: ${response.status()}`);
      console.log(`  ✅ Title: ${title}`);
      console.log(`  ✅ Content rendered\n`);

      passed++;
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}\n`);
      failed++;
    }
  }

  await browser.close();

  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log('═══════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

testDocsPages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
