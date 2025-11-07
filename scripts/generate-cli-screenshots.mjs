#!/usr/bin/env node
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';
import { join } from 'path';

// CLI commands to screenshot (safe subset)
const commands = [
  {
    id: 'git-status',
    command: 'git status',
    theme: 'dracula',
    prompt: '$ ',
  },
  {
    id: 'git-log',
    command: 'git log --oneline -5',
    theme: 'monokai',
    prompt: '$ ',
  },
  {
    id: 'ls-plugins',
    command: 'ls -la src/lib/plugins/',
    theme: 'solarized',
    prompt: '$ ',
  },
  {
    id: 'package-json',
    command: 'head -20 package.json',
    theme: 'dracula',
    prompt: '$ ',
  },
  {
    id: 'pnpm-test',
    command: 'echo "pnpm run test"',
    theme: 'dracula',
    prompt: '$ ',
    mockOutput: `
> @goobits/docs-engine@1.0.0 test
> vitest

✓ src/lib/plugins/katex.test.ts (28 tests) 30ms
✓ src/lib/plugins/code-highlight.test.ts (13 tests) 359ms
✓ src/lib/server/sitemap.test.ts (12 tests) 6ms

Test Files  8 passed (8)
     Tests  108 passed (108)
`,
  },
  {
    id: 'tsx-generate',
    command: 'echo "tsx generate-symbols.ts"',
    theme: 'dracula',
    prompt: '$ ',
    mockOutput: `
🚀 Generating symbol map for docs-engine...

🔍 Scanning TypeScript files...
   Found 49 TypeScript files

✅ Generated symbol map: 166 symbols
   Output: docs/.generated/symbol-map.json
`,
  },
];

// Theme colors
const themes = {
  dracula: {
    bg: '#282a36',
    fg: '#f8f8f2',
    prompt: '#50fa7b',
    command: '#8be9fd',
  },
  monokai: {
    bg: '#272822',
    fg: '#f8f8f2',
    prompt: '#a6e22e',
    command: '#66d9ef',
  },
  solarized: {
    bg: '#002b36',
    fg: '#839496',
    prompt: '#859900',
    command: '#268bd2',
  },
  nord: {
    bg: '#2e3440',
    fg: '#d8dee9',
    prompt: '#a3be8c',
    command: '#88c0d0',
  },
};

function createTerminalHTML(command, output, theme = 'dracula', prompt = '$ ') {
  const colors = themes[theme];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: ${colors.bg};
      color: ${colors.fg};
      font-family: monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: 20px;
    }
    .terminal {
      background: ${colors.bg};
      border-radius: 6px;
      padding: 20px;
      min-height: 200px;
    }
    .prompt {
      color: ${colors.prompt};
      font-weight: bold;
    }
    .command {
      color: ${colors.command};
      display: inline;
    }
    .output {
      color: ${colors.fg};
      white-space: pre-wrap;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="terminal">
    <div><span class="prompt">${prompt}</span><span class="command">${command}</span></div>
    <div class="output">${output}</div>
  </div>
</body>
</html>
`;
}

async function generateScreenshot(cmd) {
  console.log(`\n📸 Generating screenshot: ${cmd.id}`);

  // Execute command or use mock output
  let output = '';
  if (cmd.mockOutput) {
    output = cmd.mockOutput.trim();
  } else {
    try {
      output = execSync(cmd.command, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 10000,
      }).trim();
    } catch (error) {
      output = error.stdout || error.message;
    }
  }

  // Truncate if too long
  if (output.length > 2000) {
    output = output.substring(0, 2000) + '\n... (truncated)';
  }

  // Create HTML
  const html = createTerminalHTML(cmd.command, output, cmd.theme, cmd.prompt);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 900, height: 600 },
    deviceScaleFactor: 1, // Avoid retina for stability
  });

  // Set content and screenshot
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100); // Brief wait for rendering

  // Ensure output directory exists
  const outputDir = 'static/screenshots/examples';
  mkdirSync(outputDir, { recursive: true });

  // Take screenshot
  const outputPath = join(outputDir, `${cmd.id}.png`);
  await page.screenshot({
    path: outputPath,
    fullPage: false,
  });

  console.log(`   ✓ Saved: ${outputPath}`);

  await browser.close();
}

async function main() {
  console.log('🎬 Starting CLI screenshot generation...\n');
  console.log(`Commands to process: ${commands.length}`);

  for (const cmd of commands) {
    await generateScreenshot(cmd);
  }

  console.log('\n✅ All screenshots generated successfully!');
  console.log(`\nScreenshots saved to: static/screenshots/examples/`);
}

main().catch(console.error);
